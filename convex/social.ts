import { ConvexError, v, type Infer } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { CONNECTIONS_LIMIT } from "./lib/limits";
import { avatarUrlFor, edgesOf, findFollow, profileFor, requireUserId } from "./lib/session";
import { findBlock, hiddenFrom } from "./lib/blocks";
import { rowsForUser } from "./lib/groups";
import { findRequest, incomingRequests, requestedBy } from "./lib/requests";
import { endSharingBetween } from "./lib/sharing";
import { normalizeUsername } from "./lib/username";

const SEARCH_MIN = 2;
const SEARCH_LIMIT = 20;

export type Person = {
  userId: Id<"users">;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  youFollow: boolean;
  followsYou: boolean;
  /** You've asked to follow them and they haven't answered. */
  requested: boolean;
  isYou: boolean;
};

type ProfileWithAvatar = Doc<"profiles"> & { avatarUrl: string | null };

const withAvatar = async (ctx: QueryCtx, profile: Doc<"profiles">): Promise<ProfileWithAvatar> => ({
  ...profile,
  avatarUrl: await avatarUrlFor(ctx, profile),
});

const toPerson = (
  profile: ProfileWithAvatar,
  relation: { youFollow: boolean; followsYou: boolean; requested?: boolean; isYou?: boolean },
): Person => ({
  userId: profile.userId,
  username: profile.username,
  displayName: profile.displayName,
  avatarUrl: profile.avatarUrl,
  requested: false,
  isYou: false,
  ...relation,
});

const connectionKind = v.union(
  v.literal("friends"),
  v.literal("following"),
  v.literal("followers"),
);

export type ConnectionKind = Infer<typeof connectionKind>;

const byName = (a: Person, b: Person) => a.displayName.localeCompare(b.displayName);

/** Profiles for `ids`, in order, skipping accounts that never picked a username. */
const profilesFor = async (ctx: QueryCtx, ids: Id<"users">[]) => {
  const profiles = await Promise.all(ids.map((id) => profileFor(ctx, id)));
  return Promise.all(profiles.filter((p) => p !== null).map((p) => withAvatar(ctx, p)));
};

/** Asks to follow someone. They become a follower only once they accept. */
export const follow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireUserId(ctx);
    if (me === userId) throw new ConvexError("You can't follow yourself.");
    // Someone who blocked you looks like they don't exist, as on their profile.
    if (!(await profileFor(ctx, userId)) || (await findBlock(ctx, userId, me))) {
      throw new ConvexError("That account doesn't exist.");
    }
    if (await findBlock(ctx, me, userId)) throw new ConvexError("Unblock them to follow them.");
    if ((await findFollow(ctx, me, userId)) || (await findRequest(ctx, me, userId))) return;
    await ctx.db.insert("followRequests", {
      requesterId: me,
      targetId: userId,
      requestedAt: Date.now(),
    });
  },
});

/** Accepts or declines someone's request to follow the caller. */
export const respond = mutation({
  args: { userId: v.id("users"), accept: v.boolean() },
  handler: async (ctx, { userId, accept }) => {
    const me = await requireUserId(ctx);
    const request = await findRequest(ctx, userId, me);
    if (!request) return;
    await ctx.db.delete(request._id);
    if (accept && !(await findFollow(ctx, userId, me))) {
      await ctx.db.insert("follows", { followerId: userId, followeeId: me });
    }
  },
});

/** People asking to follow the caller, newest first. */
export const requests = query({
  args: {},
  handler: async (ctx): Promise<Person[]> => {
    const me = await requireUserId(ctx);
    const rows = await incomingRequests(ctx, me);
    const [profiles, mine] = await Promise.all([
      profilesFor(
        ctx,
        rows.map((r) => r.requesterId),
      ),
      edgesOf(ctx, me),
    ]);
    return profiles.map((p) =>
      toPerson(p, { youFollow: mine.following.has(p.userId), followsYou: false }),
    );
  },
});

/** What's waiting on the caller: follow requests plus group invites. */
export const pendingCount = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const me = await requireUserId(ctx);
    const [asks, groups] = await Promise.all([incomingRequests(ctx, me), rowsForUser(ctx, me)]);
    return asks.length + groups.filter((r) => r.status === "invited").length;
  },
});

export const unfollow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireUserId(ctx);
    // Also withdraws a request that hasn't been answered.
    const [edge, request] = await Promise.all([
      findFollow(ctx, me, userId),
      findRequest(ctx, me, userId),
    ]);
    if (edge) await ctx.db.delete(edge._id);
    if (request) await ctx.db.delete(request._id);
    // Sharing is for friends only, and unfollowing ends the friendship.
    await endSharingBetween(ctx, me, userId);
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
    const requested = await requestedBy(ctx, me);

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
        .map((p) =>
          toPerson(p, { youFollow: false, followsYou: true, requested: requested.has(p.userId) }),
        )
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

    const [matches, hidden] = await Promise.all([
      ctx.db
        .query("profiles")
        .withSearchIndex("search_username", (q) => q.search("username", cleaned))
        .take(SEARCH_LIMIT + 1),
      hiddenFrom(ctx, me),
    ]);

    return Promise.all(
      matches
        .filter((p) => p.userId !== me && !hidden.has(p.userId))
        .slice(0, SEARCH_LIMIT)
        .map(async (p) => {
          const [out, back, request, profile] = await Promise.all([
            findFollow(ctx, me, p.userId),
            findFollow(ctx, p.userId, me),
            findRequest(ctx, me, p.userId),
            withAvatar(ctx, p),
          ]);
          return toPerson(profile, {
            youFollow: out !== null,
            followsYou: back !== null,
            requested: request !== null,
          });
        }),
    );
  },
});

/**
 * Anyone's friends, following or followers, with each person's relation to
 * the caller. Lists are public to signed-in users, like the counts on a profile.
 */
export const connections = query({
  args: { userId: v.id("users"), kind: connectionKind },
  handler: async (ctx, { userId, kind }): Promise<Person[]> => {
    const me = await requireUserId(ctx);
    const edges = await edgesOf(ctx, userId);
    const [mine, hidden, requested] = await Promise.all([
      userId === me ? edges : edgesOf(ctx, me),
      hiddenFrom(ctx, me),
      requestedBy(ctx, me),
    ]);
    const ids = [...edges[kind]].filter((id) => !hidden.has(id)).slice(0, CONNECTIONS_LIMIT);
    const profiles = await profilesFor(ctx, ids);
    return profiles
      .map((p) =>
        toPerson(p, {
          youFollow: mine.following.has(p.userId),
          followsYou: mine.followers.has(p.userId),
          requested: requested.has(p.userId),
          isYou: p.userId === me,
        }),
      )
      .sort(byName);
  },
});
