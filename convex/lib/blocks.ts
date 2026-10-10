import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/** Upper bound on blocks read for one person; far above any real list. */
export const BLOCKS_LIMIT = 500;

export const findBlock = (ctx: QueryCtx, blockerId: Id<"users">, blockedId: Id<"users">) =>
  ctx.db
    .query("blocks")
    .withIndex("by_blocker", (q) => q.eq("blockerId", blockerId).eq("blockedId", blockedId))
    .unique();

/** Whether either of the pair has blocked the other. Blocks hide people both ways. */
export const blockedEitherWay = async (ctx: QueryCtx, a: Id<"users">, b: Id<"users">) => {
  const [ab, ba] = await Promise.all([findBlock(ctx, a, b), findBlock(ctx, b, a)]);
  return ab !== null || ba !== null;
};

/** Everyone `userId` has blocked or been blocked by, to filter out of lists. */
export const hiddenFrom = async (ctx: QueryCtx, userId: Id<"users">) => {
  const [mine, theirs] = await Promise.all([
    ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
      .take(BLOCKS_LIMIT),
    ctx.db
      .query("blocks")
      .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
      .take(BLOCKS_LIMIT),
  ]);
  return new Set([...mine.map((b) => b.blockedId), ...theirs.map((b) => b.blockerId)]);
};
