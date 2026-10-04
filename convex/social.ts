import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { findFollow, profileFor, requireUserId } from "./lib/session";
import { normalizeUsername } from "./lib/username";

const SEARCH_MIN = 2;
const SEARCH_LIMIT = 20;

export type Person = {
  userId: Id<"users">;
  username: string;
  displayName: string;
  youFollow: boolean;
  followsYou: boolean;
};

const toPerson = (
  profile: Doc<"profiles">,
  relation: { youFollow: boolean; followsYou: boolean },
): Person => ({
  userId: profile.userId,
  username: profile.username,
  displayName: profile.displayName,
  ...relation,
});

const byName = (a: Person, b: Person) => a.displayName.localeCompare(b.displayName);

/** Profiles for `ids`, in order, skipping accounts that never picked a username. */
const profilesFor = async (ctx: QueryCtx, ids: Id<"users">[]) => {
  const profiles = await Promise.all(ids.map((id) => profileFor(ctx, id)));
  return profiles.filter((p) => p !== null);
};

export const follow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireUserId(ctx);
    if (me === userId) throw new ConvexError("You can't follow yourself.");
    if (!(await profileFor(ctx, userId))) throw new ConvexError("That account doesn't exist.");
    if (await findFollow(ctx, me, userId)) return;
    await ctx.db.insert("follows", { followerId: me, followeeId: userId });
  },
});

export const unfollow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireUserId(ctx);
    const edge = await findFollow(ctx, me, userId);
    if (edge) await ctx.db.delete(edge._id);
  },
});

/**
 * Everyone connected to the caller, split three ways. Friends are mutual
 * follows; the other two lists hold only the one-way edges.
 */
export const network = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUserId(ctx);

    const [outgoing, incoming] = await Promise.all([
      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", me))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_followee", (q) => q.eq("followeeId", me))
        .collect(),
    ]);

    const followingIds = new Set(outgoing.map((f) => f.followeeId));
    const followerIds = new Set(incoming.map((f) => f.followerId));

    const [following, followers] = await Promise.all([
      profilesFor(ctx, [...followingIds]),
      profilesFor(
        ctx,
        [...followerIds].filter((id) => !followingIds.has(id)),
      ),
    ]);

    return {
      friends: following
        .filter((p) => followerIds.has(p.userId))
        .map((p) => toPerson(p, { youFollow: true, followsYou: true }))
        .sort(byName),
      following: following
        .filter((p) => !followerIds.has(p.userId))
        .map((p) => toPerson(p, { youFollow: true, followsYou: false }))
        .sort(byName),
      followers: followers
        .map((p) => toPerson(p, { youFollow: false, followsYou: true }))
        .sort(byName),
    };
  },
});

/** Find people by username prefix. Excludes the caller. */
export const search = query({
  args: { term: v.string() },
  handler: async (ctx, { term }): Promise<Person[]> => {
    const me = await requireUserId(ctx);
    const cleaned = normalizeUsername(term).replace(/[^a-z0-9_]/g, "");
    if (cleaned.length < SEARCH_MIN) return [];

    const matches = await ctx.db
      .query("profiles")
      .withSearchIndex("search_username", (q) => q.search("username", cleaned))
      .take(SEARCH_LIMIT + 1);

    return Promise.all(
      matches
        .filter((p) => p.userId !== me)
        .slice(0, SEARCH_LIMIT)
        .map(async (p) => {
          const [out, back] = await Promise.all([
            findFollow(ctx, me, p.userId),
            findFollow(ctx, p.userId, me),
          ]);
          return toPerson(p, { youFollow: out !== null, followsYou: back !== null });
        }),
    );
  },
});
