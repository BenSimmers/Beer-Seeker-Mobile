// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { follow, HOUR, makeFriends, makeUser, newTest } from "./test.helpers";

describe("blocking", () => {
  it("ends follows and location sharing both ways", async () => {
    const t = newTest();
    const { ben, sam } = await makeFriends(t);
    await sam.as.mutation(api.location.startSharing, { friendId: ben.userId, minutes: HOUR });
    await sam.as.mutation(api.location.publishLocation, { lat: 1, lng: 2 });

    await ben.as.mutation(api.blocks.block, { userId: sam.userId });

    expect(await ben.as.query(api.social.network, {})).toEqual({
      friends: [],
      following: [],
      followers: [],
    });
    expect(await ben.as.query(api.location.sharedWithMe, {})).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("liveLocations").collect())).toEqual([]);
  });

  it("hides the blocker from the blocked person, who isn't told", async () => {
    const t = newTest();
    const { ben, sam } = await makeFriends(t);
    await ben.as.mutation(api.blocks.block, { userId: sam.userId });

    // To Sam, Ben looks like he doesn't exist.
    expect(await sam.as.query(api.profiles.view, { userId: ben.userId })).toBeNull();
    expect(await sam.as.query(api.social.search, { term: "ben" })).toEqual([]);
    await expect(sam.as.mutation(api.social.follow, { userId: ben.userId })).rejects.toThrow(
      /doesn't exist/,
    );

    // Ben still sees Sam, marked blocked, so he can lift it.
    expect(await ben.as.query(api.profiles.view, { userId: sam.userId })).toMatchObject({
      youBlocked: true,
      favourites: null,
    });
    expect(await ben.as.query(api.social.search, { term: "sam" })).toEqual([]);
    await expect(ben.as.mutation(api.social.follow, { userId: sam.userId })).rejects.toThrow(
      /Unblock/,
    );
  });

  it("drops blocked people from anyone's connection lists", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const kim = await makeUser(t, "kim");
    await follow(ben, kim);
    await follow(sam, kim);

    await sam.as.mutation(api.blocks.block, { userId: ben.userId });

    const followersOfKim = (as: typeof ben.as) =>
      as.query(api.social.connections, { userId: kim.userId, kind: "followers" });
    expect((await followersOfKim(ben.as)).map((p) => p.username)).toEqual(["ben"]);
    expect((await followersOfKim(sam.as)).map((p) => p.username)).toEqual(["sam"]);
    expect((await followersOfKim(kim.as)).map((p) => p.username)).toEqual(["ben", "sam"]);
  });

  it("lists blocks and lifts them without restoring follows", async () => {
    const t = newTest();
    const { ben, sam } = await makeFriends(t);
    await ben.as.mutation(api.blocks.block, { userId: sam.userId });
    expect(await ben.as.query(api.blocks.list, {})).toMatchObject([{ username: "sam" }]);

    await ben.as.mutation(api.blocks.unblock, { userId: sam.userId });

    expect(await ben.as.query(api.blocks.list, {})).toEqual([]);
    expect(await sam.as.query(api.profiles.view, { userId: ben.userId })).toMatchObject({
      youFollow: false,
      followsYou: false,
    });
    await sam.as.mutation(api.social.follow, { userId: ben.userId });
  });

  it("refuses to block yourself, and is removed with either account", async () => {
    const t = newTest();
    const { ben, sam } = await makeFriends(t);
    await expect(ben.as.mutation(api.blocks.block, { userId: ben.userId })).rejects.toThrow(
      /yourself/,
    );

    await ben.as.mutation(api.blocks.block, { userId: sam.userId });
    await sam.as.mutation(api.account.deleteAccount, {});
    expect(await t.run((ctx) => ctx.db.query("blocks").collect())).toEqual([]);
  });
});
