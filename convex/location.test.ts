// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type T = ReturnType<typeof convexTest>;

const HOUR = 60;

const makeUser = async (t: T, username: string) => {
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: `${username}@example.com` });
    const sessionId = await ctx.db.insert("authSessions", {
      userId,
      expirationTime: Date.now() + 24 * 60 * 60_000,
    });
    return { userId, sessionId };
  });
  const as = t.withIdentity({ subject: `${ids.userId}|${ids.sessionId}` });
  await as.mutation(api.profiles.create, { username, displayName: username });
  return { ...ids, as };
};

const makeFriends = async (t: T) => {
  const ben = await makeUser(t, "ben");
  const sam = await makeUser(t, "sam");
  await ben.as.mutation(api.social.follow, { userId: sam.userId });
  await sam.as.mutation(api.social.follow, { userId: ben.userId });
  return { ben, sam };
};

const liveRows = (t: T) =>
  t.run(async (ctx) => (await ctx.db.query("liveLocations").collect()).length);

afterEach(() => {
  vi.useRealTimers();
});

describe("location sharing", () => {
  it("shows a friend's position only after they opt in", async () => {
    const t = convexTest(schema, modules);
    const { ben, sam } = await makeFriends(t);

    // Nothing is stored while Ben isn't sharing with anyone.
    expect(await ben.as.mutation(api.location.publishLocation, { lat: -33.86, lng: 151.2 })).toBe(
      false,
    );
    expect(await liveRows(t)).toBe(0);
    expect(await sam.as.query(api.location.friendLocation, { friendId: ben.userId })).toBeNull();

    await ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: HOUR });
    expect(await sam.as.query(api.location.friendLocation, { friendId: ben.userId })).toMatchObject(
      { position: null },
    );

    expect(
      await ben.as.mutation(api.location.publishLocation, {
        lat: -33.86,
        lng: 151.2,
        accuracy: 12,
      }),
    ).toBe(true);
    expect(await sam.as.query(api.location.friendLocation, { friendId: ben.userId })).toMatchObject(
      { position: { lat: -33.86, lng: 151.2, accuracy: 12 } },
    );

    // Sharing is one-way: Ben can't see Sam.
    expect(await ben.as.query(api.location.friendLocation, { friendId: sam.userId })).toBeNull();
  });

  it("refuses to share with someone who isn't a friend", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    await ben.as.mutation(api.social.follow, { userId: sam.userId });

    await expect(
      ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: HOUR }),
    ).rejects.toThrow(/friends/);
  });

  it("rejects sharing times outside the allowed range", async () => {
    const t = convexTest(schema, modules);
    const { ben, sam } = await makeFriends(t);
    await expect(
      ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: 5 }),
    ).rejects.toThrow(/between/);
    await expect(
      ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: 48 * HOUR }),
    ).rejects.toThrow(/between/);
  });

  it("forgets the stored position when sharing stops", async () => {
    const t = convexTest(schema, modules);
    const { ben, sam } = await makeFriends(t);
    await ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: HOUR });
    await ben.as.mutation(api.location.publishLocation, { lat: 1, lng: 2 });

    await ben.as.mutation(api.location.stopSharing, { friendId: sam.userId });

    expect(await sam.as.query(api.location.friendLocation, { friendId: ben.userId })).toBeNull();
    expect(await liveRows(t)).toBe(0);
  });

  it("ends sharing both ways on unfollow", async () => {
    const t = convexTest(schema, modules);
    const { ben, sam } = await makeFriends(t);
    await ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: HOUR });
    await sam.as.mutation(api.location.startSharing, { friendId: ben.userId, minutes: HOUR });
    await ben.as.mutation(api.location.publishLocation, { lat: 1, lng: 2 });

    await sam.as.mutation(api.social.unfollow, { userId: ben.userId });

    expect(await ben.as.query(api.location.shares, {})).toEqual({ outgoing: [], incoming: [] });
    expect(await liveRows(t)).toBe(0);
  });

  it("expires shares on schedule, but not ones that were extended", async () => {
    vi.useFakeTimers();
    const t = convexTest(schema, modules);
    const { ben, sam } = await makeFriends(t);
    await ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: HOUR });
    await ben.as.mutation(api.location.publishLocation, { lat: 1, lng: 2 });

    // Extend to 4h half an hour in: the original 1h expiry must not fire.
    vi.advanceTimersByTime(30 * 60_000);
    await ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: 4 * HOUR });
    vi.advanceTimersByTime(60 * 60_000);
    await t.finishInProgressScheduledFunctions();
    expect(
      await sam.as.query(api.location.friendLocation, { friendId: ben.userId }),
    ).not.toBeNull();

    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await sam.as.query(api.location.friendLocation, { friendId: ben.userId })).toBeNull();
    expect(await liveRows(t)).toBe(0);
  });

  it("is cleaned up when either account is deleted", async () => {
    const t = convexTest(schema, modules);
    const { ben, sam } = await makeFriends(t);
    await ben.as.mutation(api.location.startSharing, { friendId: sam.userId, minutes: HOUR });
    await sam.as.mutation(api.location.startSharing, { friendId: ben.userId, minutes: HOUR });
    await ben.as.mutation(api.location.publishLocation, { lat: 1, lng: 2 });

    await ben.as.mutation(api.account.deleteAccount, {});

    const left = await t.run(async (ctx) => ({
      shares: (await ctx.db.query("locationShares").collect()).length,
      live: (await ctx.db.query("liveLocations").collect()).length,
    }));
    expect(left).toEqual({ shares: 0, live: 0 });
  });
});
