import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * The caller's user id, or null when signed out. Also null for an access
 * token that outlived its account: tokens stay valid for a while after
 * deleteAccount removes the user.
 */
export const currentUserId = async (ctx: QueryCtx): Promise<Id<"users"> | null> => {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return (await ctx.db.get(userId)) ? userId : null;
};

/** The caller's user id. Never take a user id from the client for "me". */
export const requireUserId = async (ctx: QueryCtx): Promise<Id<"users">> => {
  const userId = await currentUserId(ctx);
  if (!userId) throw new ConvexError("You need to sign in first.");
  return userId;
};

export const avatarUrlFor = async (
  ctx: QueryCtx,
  profile: Pick<Doc<"profiles">, "avatarId">,
): Promise<string | null> => (profile.avatarId ? ctx.storage.getUrl(profile.avatarId) : null);

export const profileFor = (ctx: QueryCtx, userId: Id<"users">): Promise<Doc<"profiles"> | null> =>
  ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

/** Most follows read for one person's lists and counts; counts above it show as "N+". */
export const CONNECTIONS_LIMIT = 500;

export const edgesOf = async (ctx: QueryCtx, userId: Id<"users">) => {
  const [outgoing, incoming] = await Promise.all([
    ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .take(CONNECTIONS_LIMIT),
    ctx.db
      .query("follows")
      .withIndex("by_followee", (q) => q.eq("followeeId", userId))
      .take(CONNECTIONS_LIMIT),
  ]);
  const following = new Set(outgoing.map((f) => f.followeeId));
  const followers = new Set(incoming.map((f) => f.followerId));
  const friends = new Set([...following].filter((id) => followers.has(id)));
  return { following, followers, friends };
};

export const findFollow = (ctx: QueryCtx, followerId: Id<"users">, followeeId: Id<"users">) =>
  ctx.db
    .query("follows")
    .withIndex("by_follower", (q) => q.eq("followerId", followerId).eq("followeeId", followeeId))
    .unique();
