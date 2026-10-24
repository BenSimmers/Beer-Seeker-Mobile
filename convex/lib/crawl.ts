import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export const CRAWL_STOPS_MAX = 20;

export const stopsOf = (ctx: QueryCtx, groupId: Id<"groups">) =>
  ctx.db
    .query("crawlStops")
    .withIndex("by_group", (q) => q.eq("groupId", groupId))
    .take(CRAWL_STOPS_MAX);
