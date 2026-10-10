import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { areFriends, requireUserId } from "./lib/session";
import {
  SHARES_LIMIT,
  findShare,
  forgetLocationIfUnshared,
  liveLocationFor,
  requireShareMinutes,
  shareUntil,
} from "./lib/sharing";

type ShareSummary = { userId: Id<"users">; expiresAt: number };

type FriendPosition = {
  lat: number;
  lng: number;
  accuracy: number | null;
  updatedAt: number;
};

const toPosition = (live: Doc<"liveLocations"> | null): FriendPosition | null =>
  live
    ? { lat: live.lat, lng: live.lng, accuracy: live.accuracy ?? null, updatedAt: live.updatedAt }
    : null;

/**
 * Lets a friend see where you are for `minutes`. Calling it again while
 * already sharing just moves the end time.
 */
export const startSharing = mutation({
  args: { friendId: v.id("users"), minutes: v.number() },
  handler: async (ctx, { friendId, minutes }) => {
    const me = await requireUserId(ctx);
    requireShareMinutes(minutes);
    if (!(await areFriends(ctx, me, friendId))) {
      throw new ConvexError("You can only share your location with friends.");
    }
    const expiresAt = Date.now() + minutes * 60_000;
    await shareUntil(ctx, me, friendId, expiresAt);
    return expiresAt;
  },
});

export const stopSharing = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, { friendId }) => {
    const me = await requireUserId(ctx);
    const share = await findShare(ctx, me, friendId);
    if (share) await ctx.db.delete(share._id);
    await forgetLocationIfUnshared(ctx, me);
  },
});

export const stopAllSharing = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await requireUserId(ctx);
    const shares = await ctx.db
      .query("locationShares")
      .withIndex("by_owner", (q) => q.eq("ownerId", me))
      .take(SHARES_LIMIT);
    for (const share of shares) await ctx.db.delete(share._id);
    await forgetLocationIfUnshared(ctx, me);
  },
});

/**
 * Scheduled for each share's end time. Extending a share schedules a new run,
 * so a run whose `expiresAt` no longer matches has been superseded.
 */
export const expireShare = internalMutation({
  args: { shareId: v.id("locationShares"), expiresAt: v.number() },
  handler: async (ctx, { shareId, expiresAt }) => {
    const share = await ctx.db.get(shareId);
    if (!share || share.expiresAt !== expiresAt) return;
    await ctx.db.delete(shareId);
    await forgetLocationIfUnshared(ctx, share.ownerId);
  },
});

/**
 * Stores the caller's position, but only while someone can see it. Returns
 * whether it was kept, so the client can stop sending when sharing ends.
 */
export const publishLocation = mutation({
  args: { lat: v.number(), lng: v.number(), accuracy: v.optional(v.number()) },
  handler: async (ctx, { lat, lng, accuracy }) => {
    const me = await requireUserId(ctx);
    if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) {
      throw new ConvexError("That isn't a valid position.");
    }
    const sharing = await ctx.db
      .query("locationShares")
      .withIndex("by_owner", (q) => q.eq("ownerId", me))
      .first();
    if (!sharing) return false;

    const fields = {
      lat,
      lng,
      accuracy:
        accuracy !== undefined && Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : undefined,
      updatedAt: Date.now(),
    };
    const existing = await liveLocationFor(ctx, me);
    if (existing) await ctx.db.patch(existing._id, fields);
    else await ctx.db.insert("liveLocations", { userId: me, ...fields });
    return true;
  },
});

export const shares = query({
  args: {},
  handler: async (ctx): Promise<{ outgoing: ShareSummary[]; incoming: ShareSummary[] }> => {
    const me = await requireUserId(ctx);
    const [outgoing, incoming] = await Promise.all([
      ctx.db
        .query("locationShares")
        .withIndex("by_owner", (q) => q.eq("ownerId", me))
        .take(SHARES_LIMIT),
      ctx.db
        .query("locationShares")
        .withIndex("by_viewer", (q) => q.eq("viewerId", me))
        .take(SHARES_LIMIT),
    ]);
    return {
      outgoing: outgoing.map((s) => ({ userId: s.viewerId, expiresAt: s.expiresAt })),
      incoming: incoming.map((s) => ({ userId: s.ownerId, expiresAt: s.expiresAt })),
    };
  },
});

/**
 * A friend's position, if they are sharing it with the caller. `null` means
 * they aren't (or stopped); `position: null` means sharing but no fix yet.
 */
export const friendLocation = query({
  args: { friendId: v.id("users") },
  handler: async (
    ctx,
    { friendId },
  ): Promise<{ expiresAt: number; position: FriendPosition | null } | null> => {
    const me = await requireUserId(ctx);
    const share = await findShare(ctx, friendId, me);
    if (!share) return null;
    const live = await liveLocationFor(ctx, friendId);
    return {
      expiresAt: share.expiresAt,
      position: toPosition(live),
    };
  },
});

/**
 * Everyone sharing with the caller, with their latest position when there is
 * one. One subscription for the friends map instead of a query per friend.
 */
export const sharedWithMe = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ userId: Id<"users">; expiresAt: number; position: FriendPosition | null }[]> => {
    const me = await requireUserId(ctx);
    const incoming = await ctx.db
      .query("locationShares")
      .withIndex("by_viewer", (q) => q.eq("viewerId", me))
      .take(SHARES_LIMIT);
    return Promise.all(
      incoming.map(async (share) => {
        return {
          userId: share.ownerId,
          expiresAt: share.expiresAt,
          position: toPosition(await liveLocationFor(ctx, share.ownerId)),
        };
      }),
    );
  },
});
