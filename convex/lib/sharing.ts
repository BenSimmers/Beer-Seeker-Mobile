import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const SHARE_MIN_MINUTES = 15;
export const SHARE_MAX_MINUTES = 24 * 60;

/** Upper bound on shares one person reads at once; far above any friend list. */
export const SHARES_LIMIT = 200;

export const requireShareMinutes = (minutes: number) => {
  if (!Number.isFinite(minutes) || minutes < SHARE_MIN_MINUTES || minutes > SHARE_MAX_MINUTES) {
    throw new ConvexError("Pick a sharing time between 15 minutes and 24 hours.");
  }
};

/**
 * Lets `viewerId` see `ownerId` until `expiresAt`, or moves the end time of
 * an existing share. Callers check the pair are friends first.
 */
export const shareUntil = async (
  ctx: MutationCtx,
  ownerId: Id<"users">,
  viewerId: Id<"users">,
  expiresAt: number,
) => {
  const existing = await findShare(ctx, ownerId, viewerId);
  let shareId = existing?._id;
  if (shareId) await ctx.db.patch(shareId, { expiresAt });
  else shareId = await ctx.db.insert("locationShares", { ownerId, viewerId, expiresAt });
  await ctx.scheduler.runAt(expiresAt, internal.location.expireShare, { shareId, expiresAt });
};

export const findShare = (ctx: QueryCtx, ownerId: Id<"users">, viewerId: Id<"users">) =>
  ctx.db
    .query("locationShares")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId).eq("viewerId", viewerId))
    .unique();

export const liveLocationFor = (ctx: QueryCtx, userId: Id<"users">) =>
  ctx.db
    .query("liveLocations")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

export const forgetLocationIfUnshared = async (ctx: MutationCtx, ownerId: Id<"users">) => {
  const remaining = await ctx.db
    .query("locationShares")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .first();
  if (remaining) return;
  const live = await liveLocationFor(ctx, ownerId);
  if (live) await ctx.db.delete(live._id);
};

export const endSharingBetween = async (ctx: MutationCtx, a: Id<"users">, b: Id<"users">) => {
  const shares = await Promise.all([findShare(ctx, a, b), findShare(ctx, b, a)]);
  for (const share of shares) if (share) await ctx.db.delete(share._id);
  await Promise.all([forgetLocationIfUnshared(ctx, a), forgetLocationIfUnshared(ctx, b)]);
};
