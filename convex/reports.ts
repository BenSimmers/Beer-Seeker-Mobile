import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { REPORT_DETAILS_MAX, reportReason } from "./lib/reports";
import { profileFor, requireUserId } from "./lib/session";

export const report = mutation({
  args: { userId: v.id("users"), reason: reportReason, details: v.optional(v.string()) },
  handler: async (ctx, { userId, reason, details }) => {
    const me = await requireUserId(ctx);
    if (me === userId) throw new ConvexError("You can't report yourself.");
    const profile = await profileFor(ctx, userId);
    if (!profile) throw new ConvexError("That account doesn't exist.");
    const note = details?.trim() ?? "";
    if (note.length > REPORT_DETAILS_MAX) {
      throw new ConvexError(`Keep the details under ${REPORT_DETAILS_MAX} characters.`);
    }

    const fields = {
      reason,
      details: note || undefined,
      // As reported: they can edit their profile before anyone looks.
      snapshot: { username: profile.username, displayName: profile.displayName, bio: profile.bio },
      reportedAt: Date.now(),
    };
    const open = await ctx.db
      .query("reports")
      .withIndex("by_reporter", (q) =>
        q.eq("reporterId", me).eq("reportedId", userId).eq("status", "open"),
      )
      .first();
    if (open) await ctx.db.patch(open._id, fields);
    else
      await ctx.db.insert("reports", {
        reporterId: me,
        reportedId: userId,
        status: "open",
        ...fields,
      });
  },
});
