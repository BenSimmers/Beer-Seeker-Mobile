import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** Pending requests read for one person at once; far above any real backlog. */
export const REQUESTS_LIMIT = 200;

export const findRequest = (ctx: QueryCtx, requesterId: Id<"users">, targetId: Id<"users">) =>
  ctx.db
    .query("followRequests")
    .withIndex("by_requester", (q) => q.eq("requesterId", requesterId).eq("targetId", targetId))
    .unique();

export const incomingRequests = (ctx: QueryCtx, targetId: Id<"users">) =>
  ctx.db
    .query("followRequests")
    .withIndex("by_target", (q) => q.eq("targetId", targetId))
    .order("desc")
    .take(REQUESTS_LIMIT);

/** Everyone `requesterId` is waiting on. */
export const requestedBy = async (ctx: QueryCtx, requesterId: Id<"users">) => {
  const rows = await ctx.db
    .query("followRequests")
    .withIndex("by_requester", (q) => q.eq("requesterId", requesterId))
    .take(REQUESTS_LIMIT);
  return new Set(rows.map((r) => r.targetId));
};

export const dropRequestsBetween = async (ctx: MutationCtx, a: Id<"users">, b: Id<"users">) => {
  const rows = await Promise.all([findRequest(ctx, a, b), findRequest(ctx, b, a)]);
  for (const row of rows) if (row) await ctx.db.delete(row._id);
};
