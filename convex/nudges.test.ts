// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { isValidTimeZone, localWeekday, nextNudgeAt } from "./lib/nudges";
import { pushNotifications } from "./lib/push";
import { makeUser, newTest, type T, type User } from "./test.helpers";

const iso = (s: string) => new Date(s).getTime();

describe("nextNudgeAt", () => {
  it("picks the next Friday or Saturday at 6pm local", () => {
    const wed = iso("2025-11-05T01:00:00Z");
    expect(nextNudgeAt("Australia/Sydney", wed)).toBe(iso("2025-11-07T07:00:00Z"));
    expect(nextNudgeAt("Australia/Sydney", iso("2025-11-07T07:00:00Z"))).toBe(
      iso("2025-11-08T07:00:00Z"),
    );
    expect(nextNudgeAt("Australia/Sydney", iso("2025-11-08T07:30:00Z"))).toBe(
      iso("2025-11-14T07:00:00Z"),
    );
  });

  it("handles half-hour zones and DST changes", () => {
    expect(nextNudgeAt("Asia/Kolkata", iso("2025-11-05T00:00:00Z"))).toBe(
      iso("2025-11-07T12:30:00Z"),
    );
    expect(nextNudgeAt("America/New_York", iso("2025-10-29T12:00:00Z"))).toBe(
      iso("2025-10-31T22:00:00Z"),
    );
    expect(nextNudgeAt("America/New_York", iso("2025-11-03T12:00:00Z"))).toBe(
      iso("2025-11-07T23:00:00Z"),
    );
  });

  it("knows the local weekday across the date line", () => {
    expect(localWeekday("Pacific/Auckland", iso("2025-11-07T05:00:00Z"))).toBe("Friday");
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("Europe/London")).toBe(true);
  });
});

const register = (u: User, timeZone?: string) =>
  u.as.mutation(api.notifications.registerDevice, {
    pushToken: `ExponentPushToken[${u.userId}]`,
    timeZone,
  });
const inbox = (t: T, u: User) =>
  t.run(async (ctx) =>
    (await pushNotifications.getNotificationsForUser(ctx, { userId: u.userId })).map((n) => ({
      title: n.title,
      data: n.data,
    })),
  );
const tick = (t: T) => t.mutation(internal.nudges.sendDue, {});

describe("weekend nudge", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["Date"] }));
  afterEach(() => vi.useRealTimers());

  it("sends at 6pm local on Friday and Saturday only", async () => {
    vi.setSystemTime(iso("2025-11-05T01:00:00Z")); // Wed in Sydney
    const t = newTest();
    const ben = await makeUser(t, "ben");
    await register(ben, "Australia/Sydney");
    expect(await ben.as.query(api.nudges.mine, {})).toEqual({ enabled: true });

    vi.setSystemTime(iso("2025-11-07T06:45:00Z")); // Fri 5:45pm
    await tick(t);
    expect(await inbox(t, ben)).toEqual([]);

    vi.setSystemTime(iso("2025-11-07T07:00:00Z")); // Fri 6pm
    await tick(t);
    await tick(t); // A second run in the same slot doesn't repeat it.
    expect(await inbox(t, ben)).toEqual([
      { title: "It's Friday night 🍻", data: { screen: "FriendsHome" } },
    ]);

    vi.setSystemTime(iso("2025-11-08T07:00:00Z")); // Sat 6pm
    await tick(t);
    expect((await inbox(t, ben))[0]).toMatchObject({ title: "Saturday night 🍻" });
  });

  it("respects opting out, unregistering, and skips stale slots", async () => {
    vi.setSystemTime(iso("2025-11-05T01:00:00Z"));
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const amy = await makeUser(t, "amy");
    const noTz = await makeUser(t, "zed");
    await register(ben, "Australia/Sydney");
    await register(sam, "Australia/Sydney");
    await register(amy, "Australia/Sydney");
    await register(noTz);
    expect(await noTz.as.query(api.nudges.mine, {})).toBeNull();

    await ben.as.mutation(api.nudges.setEnabled, { enabled: false });
    await sam.as.mutation(api.notifications.unregisterDevice, {});

    vi.setSystemTime(iso("2025-11-07T09:00:00Z"));
    await tick(t);
    expect(await inbox(t, amy)).toEqual([]);

    vi.setSystemTime(iso("2025-11-08T07:00:00Z"));
    await tick(t);
    expect(await inbox(t, amy)).toHaveLength(1);
    expect(await inbox(t, ben)).toEqual([]);
    expect(await inbox(t, sam)).toEqual([]);

    await register(ben, "Australia/Sydney");
    expect(await ben.as.query(api.nudges.mine, {})).toEqual({ enabled: false });
    await ben.as.mutation(api.nudges.setEnabled, { enabled: true });
    vi.setSystemTime(iso("2025-11-14T07:00:00Z"));
    await tick(t);
    expect(await inbox(t, ben)).toHaveLength(1);
  });

  it("is removed with the account", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    await register(ben, "Europe/London");
    await ben.as.mutation(api.account.deleteAccount, {});
    expect(await t.run((ctx) => ctx.db.query("weekendNudges").collect())).toEqual([]);
  });
});
