// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type T = ReturnType<typeof convexTest>;

/** A signed-in user with a profile, as Convex Auth would leave them. */
const makeUser = async (t: T, username: string) => {
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: `${username}@example.com` });
    const sessionId = await ctx.db.insert("authSessions", {
      userId,
      expirationTime: Date.now() + 60_000,
    });
    const accountId = await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: `${username}@example.com`,
      secret: "hashed",
    });
    await ctx.db.insert("authRefreshTokens", {
      sessionId,
      expirationTime: Date.now() + 60_000,
    });
    await ctx.db.insert("authVerificationCodes", {
      accountId,
      provider: "password",
      code: `code-${username}`,
      expirationTime: Date.now() + 60_000,
    });
    return { userId, sessionId };
  });
  // Convex Auth encodes "userId|sessionId" as the token subject.
  const as = t.withIdentity({ subject: `${ids.userId}|${ids.sessionId}` });
  await as.mutation(api.profiles.create, { username, displayName: username });
  return { ...ids, as };
};

const countFor = (t: T, userId: Id<"users">) =>
  t.run(async (ctx) => ({
    user: (await ctx.db.get(userId)) ? 1 : 0,
    profiles: (await ctx.db.query("profiles").collect()).filter((p) => p.userId === userId).length,
    follows: (await ctx.db.query("follows").collect()).filter(
      (f) => f.followerId === userId || f.followeeId === userId,
    ).length,
    sessions: (await ctx.db.query("authSessions").collect()).filter((s) => s.userId === userId)
      .length,
    accounts: (await ctx.db.query("authAccounts").collect()).filter((a) => a.userId === userId)
      .length,
  }));

describe("deleteAccount", () => {
  it("removes the user and everything tied to them", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");

    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    await sam.as.mutation(api.social.follow, { userId: ben.userId });

    await ben.as.mutation(api.account.deleteAccount, {});

    expect(await countFor(t, ben.userId)).toEqual({
      user: 0,
      profiles: 0,
      follows: 0,
      sessions: 0,
      accounts: 0,
    });
    const leftovers = await t.run(async (ctx) => ({
      refreshTokens: (await ctx.db.query("authRefreshTokens").collect()).length,
      codes: (await ctx.db.query("authVerificationCodes").collect()).length,
    }));
    // Only Sam's rows remain.
    expect(leftovers).toEqual({ refreshTokens: 1, codes: 1 });
  });

  it("leaves other people intact, minus the deleted friend", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    await sam.as.mutation(api.social.follow, { userId: ben.userId });

    await ben.as.mutation(api.account.deleteAccount, {});

    expect(await sam.as.query(api.profiles.me, {})).toMatchObject({ username: "sam" });
    expect(await sam.as.query(api.social.network, {})).toEqual({
      friends: [],
      following: [],
      followers: [],
    });
  });

  it("stops a leftover token from acting as the deleted user", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    await ben.as.mutation(api.account.deleteAccount, {});

    expect(await ben.as.query(api.profiles.me, {})).toBeNull();
    await expect(
      ben.as.mutation(api.profiles.create, { username: "ben2", displayName: "Ben" }),
    ).rejects.toThrow(/sign in/);
  });
});

describe("social", () => {
  it("makes mutual follows friends", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");

    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    let network = await sam.as.query(api.social.network, {});
    expect(network.followers.map((p) => p.username)).toEqual(["ben"]);
    expect(network.friends).toEqual([]);

    await sam.as.mutation(api.social.follow, { userId: ben.userId });
    network = await sam.as.query(api.social.network, {});
    expect(network.friends.map((p) => p.username)).toEqual(["ben"]);
    expect(network.followers).toEqual([]);
  });

  it("rejects duplicate usernames regardless of case", async () => {
    const t = convexTest(schema, modules);
    await makeUser(t, "ben");
    await expect(makeUser(t, "BEN")).rejects.toThrow(/taken/);
  });

  it("refuses to act without a signed-in user", async () => {
    const t = convexTest(schema, modules);
    const sam = await makeUser(t, "sam");
    await expect(t.mutation(api.social.follow, { userId: sam.userId })).rejects.toThrow(/sign in/);
  });
});
