import { mutation } from "./_generated/server";
import { leaveGroup, rowsForUser } from "./lib/groups";
import { requireUserId } from "./lib/session";

/**
 * Permanently removes the caller and everything tied to them: profile,
 * follows, follow requests, blocks, location shares and reports in both directions, group
 * memberships (owned groups pass to another member), live location,
 * favourites, profile photo, and Convex Auth's accounts and sessions.
 * App Store guideline 5.1.1(v) requires this to be reachable in-app.
 *
 * The client should call signOut afterwards to clear its stored tokens.
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    for (const row of await rowsForUser(ctx, userId)) await leaveGroup(ctx, row.groupId, userId);

    const [
      profiles,
      outgoing,
      incoming,
      sharesOut,
      sharesIn,
      liveLocations,
      favourites,
      reportsMade,
      reportsAbout,
      blocksMade,
      blocksAgainst,
      requestsMade,
      requestsReceived,
      sessions,
      accounts,
    ] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", userId))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_followee", (q) => q.eq("followeeId", userId))
        .collect(),
      ctx.db
        .query("locationShares")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .collect(),
      ctx.db
        .query("locationShares")
        .withIndex("by_viewer", (q) => q.eq("viewerId", userId))
        .collect(),
      ctx.db
        .query("liveLocations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("favouritePlaces")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("reports")
        .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
        .collect(),
      ctx.db
        .query("reports")
        .withIndex("by_reported", (q) => q.eq("reportedId", userId))
        .collect(),
      ctx.db
        .query("blocks")
        .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
        .collect(),
      ctx.db
        .query("blocks")
        .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
        .collect(),
      ctx.db
        .query("followRequests")
        .withIndex("by_requester", (q) => q.eq("requesterId", userId))
        .collect(),
      ctx.db
        .query("followRequests")
        .withIndex("by_target", (q) => q.eq("targetId", userId))
        .collect(),
      ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    const [refreshTokens, verificationCodes] = await Promise.all([
      Promise.all(
        sessions.map((s) =>
          ctx.db
            .query("authRefreshTokens")
            .withIndex("sessionId", (q) => q.eq("sessionId", s._id))
            .collect(),
        ),
      ),
      Promise.all(
        accounts.map((a) =>
          ctx.db
            .query("authVerificationCodes")
            .withIndex("accountId", (q) => q.eq("accountId", a._id))
            .collect(),
        ),
      ),
    ]);

    // Children before parents, so nothing is left pointing at a deleted row.
    const doomed = [
      ...refreshTokens.flat(),
      ...verificationCodes.flat(),
      ...sessions,
      ...accounts,
      ...outgoing,
      ...incoming,
      ...sharesOut,
      ...sharesIn,
      ...liveLocations,
      ...favourites,
      ...reportsMade,
      ...reportsAbout,
      ...blocksMade,
      ...blocksAgainst,
      ...requestsMade,
      ...requestsReceived,
      ...profiles,
    ];
    for (const profile of profiles) {
      if (profile.avatarId) await ctx.storage.delete(profile.avatarId);
    }
    for (const doc of doomed) await ctx.db.delete(doc._id);
    await ctx.db.delete(userId);
  },
});
