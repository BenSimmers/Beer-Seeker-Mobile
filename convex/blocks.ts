import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { BLOCKS_LIMIT, findBlock } from "./lib/blocks";
import { separateInGroups } from "./lib/groups";
import { dropRequestsBetween } from "./lib/requests";
import { avatarUrlFor, findFollow, profileFor, requireUserId } from "./lib/session";
import { endSharingBetween } from "./lib/sharing";

export type BlockedPerson = {
  userId: Id<"users">;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Cuts all ties with someone: follows, requests and location sharing end,
 * they leave your groups and you leave theirs, and neither of you can find or
 * follow the other until it's lifted. They aren't told.
 */
export const block = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireUserId(ctx);
    if (me === userId) throw new ConvexError("You can't block yourself.");
    if (!(await profileFor(ctx, userId))) throw new ConvexError("That account doesn't exist.");
    if (await findBlock(ctx, me, userId)) return;

    await ctx.db.insert("blocks", { blockerId: me, blockedId: userId, blockedAt: Date.now() });
    const follows = await Promise.all([findFollow(ctx, me, userId), findFollow(ctx, userId, me)]);
    for (const edge of follows) if (edge) await ctx.db.delete(edge._id);
    await dropRequestsBetween(ctx, me, userId);
    await endSharingBetween(ctx, me, userId);
    await separateInGroups(ctx, me, userId);
  },
});

/** Lifting a block doesn't restore follows; either side has to follow again. */
export const unblock = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireUserId(ctx);
    const existing = await findBlock(ctx, me, userId);
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Accounts the caller has blocked, most recent first. */
export const list = query({
  args: {},
  handler: async (ctx): Promise<BlockedPerson[]> => {
    const me = await requireUserId(ctx);
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", me))
      .take(BLOCKS_LIMIT);
    const people = await Promise.all(
      blocks
        .sort((a, b) => b.blockedAt - a.blockedAt)
        .map(async (b) => {
          const profile = await profileFor(ctx, b.blockedId);
          return (
            profile && {
              userId: profile.userId,
              username: profile.username,
              displayName: profile.displayName,
              avatarUrl: await avatarUrlFor(ctx, profile),
            }
          );
        }),
    );
    return people.filter((p) => p !== null);
  },
});
