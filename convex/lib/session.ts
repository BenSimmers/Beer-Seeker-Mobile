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

export const profileFor = (ctx: QueryCtx, userId: Id<"users">): Promise<Doc<"profiles"> | null> =>
  ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

export const findFollow = (ctx: QueryCtx, followerId: Id<"users">, followeeId: Id<"users">) =>
  ctx.db
    .query("follows")
    .withIndex("by_follower", (q) => q.eq("followerId", followerId).eq("followeeId", followeeId))
    .unique();
