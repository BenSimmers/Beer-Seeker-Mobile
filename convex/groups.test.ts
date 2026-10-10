// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { HOUR, befriend, makeUser, newTest, type T, type User } from "./test.helpers";
import type { Id } from "./_generated/dataModel";

/** Ben, friends with Sam and Kim, who aren't friends with each other. */
const setup = async (t: T) => {
  const ben = await makeUser(t, "ben");
  const sam = await makeUser(t, "sam");
  const kim = await makeUser(t, "kim");
  await befriend(ben, sam);
  await befriend(ben, kim);
  return { ben, sam, kim };
};

const names = async (u: User, groupId: Id<"groups">) =>
  (await u.as.query(api.groups.get, { groupId }))?.members.map((m) => `${m.username}:${m.status}`);

describe("groups", () => {
  it("invites friends, who join only once they accept", async () => {
    const t = newTest();
    const { ben, sam, kim } = await setup(t);

    const groupId = await ben.as.mutation(api.groups.create, {
      name: "  Weekend   crew ",
      memberIds: [sam.userId, kim.userId],
    });
    expect(await names(ben, groupId)).toEqual(["ben:member", "kim:invited", "sam:invited"]);
    expect(await sam.as.query(api.groups.mine, {})).toEqual([]);
    expect(await sam.as.query(api.groups.invites, {})).toMatchObject([
      { name: "Weekend crew", invitedBy: "ben", memberCount: 1 },
    ]);

    await sam.as.mutation(api.groups.respond, { groupId, accept: true });
    await kim.as.mutation(api.groups.respond, { groupId, accept: false });

    expect(await sam.as.query(api.groups.mine, {})).toMatchObject([
      { name: "Weekend crew", youOwn: false },
    ]);
    expect(await names(sam, groupId)).toEqual(["ben:member", "sam:member"]);
    expect(await kim.as.query(api.groups.get, { groupId })).toBeNull();
  });

  it("only lets you add friends", async () => {
    const t = newTest();
    const { ben, sam } = await setup(t);
    const groupId = await ben.as.mutation(api.groups.create, { name: "g", memberIds: [] });
    const stranger = await makeUser(t, "zed");

    await expect(
      ben.as.mutation(api.groups.invite, { groupId, userIds: [stranger.userId] }),
    ).rejects.toThrow(/friends/);
    // Sam is in now, but isn't the owner.
    await ben.as.mutation(api.groups.invite, { groupId, userIds: [sam.userId] });
    await sam.as.mutation(api.groups.respond, { groupId, accept: true });
    await expect(
      sam.as.mutation(api.groups.invite, { groupId, userIds: [ben.userId] }),
    ).rejects.toThrow(/creator/);
    await expect(sam.as.mutation(api.groups.rename, { groupId, name: "mine" })).rejects.toThrow(
      /creator/,
    );
  });

  it("hands the group on when the owner leaves, and deletes it when nobody's left", async () => {
    const t = newTest();
    const { ben, sam, kim } = await setup(t);
    const groupId = await ben.as.mutation(api.groups.create, {
      name: "g",
      memberIds: [sam.userId, kim.userId],
    });
    await sam.as.mutation(api.groups.respond, { groupId, accept: true });

    await ben.as.mutation(api.groups.leave, { groupId });
    expect(await sam.as.query(api.groups.get, { groupId })).toMatchObject({ youOwn: true });

    // Kim's invite doesn't count as a member to inherit it.
    await sam.as.mutation(api.groups.leave, { groupId });
    expect(await t.run((ctx) => ctx.db.query("groups").collect())).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("groupMembers").collect())).toEqual([]);
  });

  it("shares with the members who are your friends", async () => {
    const t = newTest();
    const { ben, sam, kim } = await setup(t);
    const groupId = await ben.as.mutation(api.groups.create, {
      name: "g",
      memberIds: [sam.userId, kim.userId],
    });
    await sam.as.mutation(api.groups.respond, { groupId, accept: true });
    await kim.as.mutation(api.groups.respond, { groupId, accept: true });

    expect(await ben.as.mutation(api.groups.shareWithGroup, { groupId, minutes: HOUR })).toEqual({
      shared: 2,
      skipped: 0,
    });
    // Sam and Kim aren't friends, so Kim is skipped.
    expect(await sam.as.mutation(api.groups.shareWithGroup, { groupId, minutes: HOUR })).toEqual({
      shared: 1,
      skipped: 1,
    });
    const kimSees = await kim.as.query(api.location.sharedWithMe, {});
    expect(kimSees.map((s) => s.userId)).toEqual([ben.userId]);
  });

  it("separates blocked people in groups", async () => {
    const t = newTest();
    const { ben, sam, kim } = await setup(t);
    await befriend(sam, kim);
    const bens = await ben.as.mutation(api.groups.create, {
      name: "bens",
      memberIds: [sam.userId, kim.userId],
    });
    const sams = await sam.as.mutation(api.groups.create, {
      name: "sams",
      memberIds: [ben.userId],
    });
    const kims = await kim.as.mutation(api.groups.create, {
      name: "kims",
      memberIds: [ben.userId, sam.userId],
    });
    for (const [u, g] of [
      [sam, bens],
      [kim, bens],
      [ben, sams],
      [ben, kims],
      [sam, kims],
    ] as const) {
      await u.as.mutation(api.groups.respond, { groupId: g, accept: true });
    }

    await ben.as.mutation(api.blocks.block, { userId: sam.userId });

    // Out of Ben's group, Ben out of Sam's.
    expect(await names(ben, bens)).toEqual(["ben:member", "kim:member"]);
    expect(await ben.as.query(api.groups.get, { groupId: sams })).toBeNull();
    // In Kim's group both stay, but can't see each other.
    expect(await names(ben, kims)).toEqual(["kim:member", "ben:member"]);
    expect(await names(sam, kims)).toEqual(["kim:member", "sam:member"]);
    expect(await names(kim, kims)).toEqual(["kim:member", "ben:member", "sam:member"]);
  });

  it("passes owned groups on when the owner deletes their account", async () => {
    const t = newTest();
    const { ben, sam } = await setup(t);
    const groupId = await ben.as.mutation(api.groups.create, {
      name: "g",
      memberIds: [sam.userId],
    });
    await sam.as.mutation(api.groups.respond, { groupId, accept: true });

    await ben.as.mutation(api.account.deleteAccount, {});

    expect(await names(sam, groupId)).toEqual(["sam:member"]);
    expect(await sam.as.query(api.groups.get, { groupId })).toMatchObject({ youOwn: true });
  });
});
