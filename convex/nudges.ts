import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { isValidTimeZone, localWeekday, nextNudgeAt, NUDGE_GRACE_MS } from "./lib/nudges";
import { notify } from "./lib/push";
import { currentUserId, requireUserId } from "./lib/session";

const BATCH = 100;

const COPY = {
  Friday: { title: "It's Friday night 🍻", body: "Looking for somewhere to go?" },
  Saturday: { title: "Saturday night 🍻", body: "Where's everyone headed?" },
} as const;
const BODY_TAIL = " Start a group, or see where your friends are.";

const rowFor = (ctx: MutationCtx, userId: Id<"users">) =>
  ctx.db
    .query("weekendNudges")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

export const armForDevice = async (ctx: MutationCtx, userId: Id<"users">, timeZone?: string) => {
  const row = await rowFor(ctx, userId);
  const tz = timeZone && isValidTimeZone(timeZone) ? timeZone : row?.timeZone;
  if (!tz) return;
  if (!row) {
    await ctx.db.insert("weekendNudges", {
      userId,
      timeZone: tz,
      optedOut: false,
      nextAt: nextNudgeAt(tz, Date.now()),
    });
    return;
  }
  await ctx.db.patch(row._id, {
    timeZone: tz,
    nextAt: row.optedOut ? undefined : nextNudgeAt(tz, Date.now()),
  });
};

export const disarm = async (ctx: MutationCtx, userId: Id<"users">) => {
  const row = await rowFor(ctx, userId);
  if (row?.nextAt !== undefined) await ctx.db.patch(row._id, { nextAt: undefined });
};

export const mine = query({
  args: {},
  returns: v.union(v.null(), v.object({ enabled: v.boolean() })),
  handler: async (ctx) => {
    const me = await currentUserId(ctx);
    if (!me) return null;
    const row = await ctx.db
      .query("weekendNudges")
      .withIndex("by_userId", (q) => q.eq("userId", me))
      .unique();
    return row ? { enabled: !row.optedOut } : null;
  },
});

export const setEnabled = mutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { enabled }) => {
    const me = await requireUserId(ctx);
    const row = await rowFor(ctx, me);
    if (!row) return null;
    await ctx.db.patch(row._id, {
      optedOut: !enabled,
      nextAt: enabled ? nextNudgeAt(row.timeZone, Date.now()) : undefined,
    });
    return null;
  },
});

export const sendDue = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("weekendNudges")
      .withIndex("by_nextAt", (q) => q.gte("nextAt", 0).lte("nextAt", now))
      .take(BATCH);

    const recipients = { Friday: [] as Id<"users">[], Saturday: [] as Id<"users">[] };
    for (const row of due) {
      const at = row.nextAt!;
      if (now - at <= NUDGE_GRACE_MS) recipients[localWeekday(row.timeZone, at)].push(row.userId);
      await ctx.db.patch(row._id, { nextAt: nextNudgeAt(row.timeZone, now) });
    }

    for (const day of ["Friday", "Saturday"] as const) {
      await notify(ctx, recipients[day], {
        title: COPY[day].title,
        body: COPY[day].body + BODY_TAIL,
        target: { screen: "FriendsHome" },
        collapseKey: "weekend-nudge",
      });
    }

    if (due.length === BATCH) await ctx.scheduler.runAfter(0, internal.nudges.sendDue, {});
    return null;
  },
});
