// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { pushNotifications } from "./lib/push";
import { befriend, makeFriends, makeUser, newTest, type T, type User } from "./test.helpers";

const register = (u: User, id = u.userId) =>
  u.as.mutation(api.notifications.registerDevice, { pushToken: `ExponentPushToken[${id}]` });

/** What's been queued for `u`, oldest first. */
const inbox = (t: T, u: User) =>
  t.run(async (ctx) =>
    (await pushNotifications.getNotificationsForUser(ctx, { userId: u.userId }))
      .map((n) => ({ title: n.title, body: n.body, data: n.data }))
      .toReversed(),
  );

const place = (name: string, lat: number) => ({
  name,
  lat,
  lng: 0,
  vicinity: `${name} St`,
  category: "pub",
});

describe("push notifications", () => {
  it("only accepts Expo push tokens", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    await expect(
      ben.as.mutation(api.notifications.registerDevice, { pushToken: "nope" }),
    ).rejects.toThrow("push token");
    await register(ben);
  });

  it("tells you about follow requests, and when yours is accepted", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    await register(ben);
    await register(sam);

    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    expect(await inbox(t, sam)).toEqual([
      {
        title: "Follow request",
        body: "ben wants to follow you.",
        data: { screen: "FriendsHome" },
      },
    ]);

    await sam.as.mutation(api.social.respond, { userId: ben.userId, accept: true });
    expect(await inbox(t, ben)).toEqual([
      {
        title: "Request accepted",
        body: "sam accepted your follow request.",
        data: { screen: "FriendsHome" },
      },
    ]);
  });

  it("works for people without a device registered", async () => {
    const t = newTest();
    const { ben, sam } = await makeFriends(t);
    expect(await inbox(t, ben)).toEqual([]);
    expect(await inbox(t, sam)).toEqual([]);
  });

  it("tells invitees about a group", async () => {
    const t = newTest();
    const { ben, sam } = await makeFriends(t);
    await register(sam);
    await ben.as.mutation(api.groups.create, { name: "Friday", memberIds: [sam.userId] });
    expect(await inbox(t, sam)).toMatchObject([{ body: "ben invited you to Friday." }]);
  });

  it("tells the rest of the group when the crawl moves on or finishes", async () => {
    const t = newTest();
    const { ben, sam } = await makeFriends(t);
    const amy = await makeUser(t, "amy");
    await befriend(ben, amy);
    const groupId = await ben.as.mutation(api.groups.create, {
      name: "Friday",
      memberIds: [sam.userId, amy.userId],
    });
    await sam.as.mutation(api.groups.respond, { groupId, accept: true });
    // Amy hasn't accepted, so she isn't on the crawl yet.
    const ids: Id<"crawlStops">[] = [];
    for (const [i, name] of ["Crown", "Swan"].entries()) {
      ids.push(await ben.as.mutation(api.crawl.addStop, { groupId, place: place(name, i * 0.01) }));
    }
    for (const u of [ben, sam, amy]) await register(u);

    await ben.as.mutation(api.crawl.setCurrent, { groupId, stopId: ids[0]! });
    // Picking the same stop again, or clearing it, sends nothing.
    await sam.as.mutation(api.crawl.setCurrent, { groupId, stopId: ids[0]! });
    await sam.as.mutation(api.crawl.setCurrent, { groupId, stopId: null });
    await sam.as.mutation(api.crawl.setCurrent, { groupId, stopId: ids[1]! });
    await sam.as.mutation(api.crawl.finish, { groupId });
    await sam.as.mutation(api.crawl.finish, { groupId });

    const target = { screen: "Group", groupId };
    expect(await inbox(t, sam)).toEqual([
      { title: "Friday", body: "Arrived at Crown", data: target },
    ]);
    expect(await inbox(t, ben)).toEqual([
      { title: "Friday", body: "Arrived at Swan", data: target },
      { title: "Friday", body: "That's the crawl done. Get home safe!", data: target },
    ]);
    expect(await inbox(t, amy)).toEqual([]);
  });

  it("stops after unregistering, and is wiped with the account", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    await register(sam);
    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    await sam.as.mutation(api.notifications.unregisterDevice, {});
    await ben.as.mutation(api.social.unfollow, { userId: sam.userId });
    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    await register(sam);
    expect(await inbox(t, sam)).toHaveLength(1);

    await sam.as.mutation(api.account.deleteAccount, {});
    expect(
      await t.run((ctx) => pushNotifications.getStatusForUser(ctx, { userId: sam.userId })),
    ).toEqual({ hasToken: false, paused: false });
    // History is looked up by token, so bring the token back to check it's gone.
    await t.run((ctx) =>
      pushNotifications.recordToken(ctx, {
        userId: sam.userId,
        pushToken: `ExponentPushToken[${sam.userId}]`,
      }),
    );
    expect(await inbox(t, sam)).toEqual([]);
  });
});
