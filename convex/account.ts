import { mutation } from "./_generated/server";
import { requireUserId } from "./lib/session";

/**
 * Permanently removes the caller and everything tied to them: profile,
 * follows in both directions, and Convex Auth's accounts and sessions.
 * App Store guideline 5.1.1(v) requires this to be reachable in-app.
 *
 * The client should call signOut afterwards to clear its stored tokens.
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const [profiles, outgoing, incoming, sessions, accounts] = await Promise.all([
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
      ...profiles,
    ];
    for (const doc of doomed) await ctx.db.delete(doc._id);
    await ctx.db.delete(userId);
  },
});
