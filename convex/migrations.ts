import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { findRequest } from "./lib/requests";
import { findFollow } from "./lib/session";

/**
 * One-off, for the switch to follow requests: each one-way follow becomes a
 * pending request; mutual follows (friends) stay. Run once per deployment:
 * `npx convex run migrations:followsToRequests`.
 */
export const followsToRequests = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("follows").paginate({ cursor: cursor ?? null, numItems: 100 });
    for (const edge of page.page) {
      if (await findFollow(ctx, edge.followeeId, edge.followerId)) continue;
      if (!(await findRequest(ctx, edge.followerId, edge.followeeId))) {
        await ctx.db.insert("followRequests", {
          requesterId: edge.followerId,
          targetId: edge.followeeId,
          requestedAt: edge._creationTime,
        });
      }
      await ctx.db.delete(edge._id);
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.followsToRequests, {
        cursor: page.continueCursor,
      });
    }
  },
});
