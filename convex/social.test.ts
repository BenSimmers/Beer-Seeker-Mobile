// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import { makeUser, newTest } from "./test.helpers";

describe("follow requests", () => {
  it("only follows once the other person accepts", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");

    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    expect(await sam.as.query(api.social.network, {})).toMatchObject({ followers: [] });
    expect((await sam.as.query(api.social.requests, {})).map((p) => p.username)).toEqual(["ben"]);
    expect(await sam.as.query(api.profiles.view, { userId: ben.userId })).toMatchObject({
      requestedYou: true,
      followsYou: false,
    });
    expect(await ben.as.query(api.social.search, { term: "sam" })).toMatchObject([
      { requested: true, youFollow: false },
    ]);

    await sam.as.mutation(api.social.respond, { userId: ben.userId, accept: true });

    expect(await sam.as.query(api.social.requests, {})).toEqual([]);
    expect(await ben.as.query(api.profiles.view, { userId: sam.userId })).toMatchObject({
      youFollow: true,
      requested: false,
    });
  });

  it("drops declined and withdrawn requests", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");

    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    await sam.as.mutation(api.social.respond, { userId: ben.userId, accept: false });
    expect(await ben.as.query(api.profiles.view, { userId: sam.userId })).toMatchObject({
      youFollow: false,
      requested: false,
    });

    await ben.as.mutation(api.social.follow, { userId: sam.userId });
    await ben.as.mutation(api.social.unfollow, { userId: sam.userId });
    expect(await sam.as.query(api.social.requests, {})).toEqual([]);
  });

  it("counts requests and group invites as pending", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const kim = await makeUser(t, "kim");
    for (const [a, b] of [
      [ben, kim],
      [kim, ben],
    ] as const) {
      await a.as.mutation(api.social.follow, { userId: b.userId });
      await b.as.mutation(api.social.respond, { userId: a.userId, accept: true });
    }
    await sam.as.mutation(api.social.follow, { userId: kim.userId });
    await ben.as.mutation(api.groups.create, { name: "g", memberIds: [kim.userId] });

    expect(await kim.as.query(api.social.pendingCount, {})).toBe(2);
  });

  it("clears requests both ways on block", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    await ben.as.mutation(api.social.follow, { userId: sam.userId });

    await sam.as.mutation(api.blocks.block, { userId: ben.userId });

    expect(await sam.as.query(api.social.requests, {})).toEqual([]);
  });

  it("migrates one-way follows into requests and keeps friends", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const kim = await makeUser(t, "kim");
    await t.run(async (ctx) => {
      await ctx.db.insert("follows", { followerId: ben.userId, followeeId: sam.userId });
      await ctx.db.insert("follows", { followerId: sam.userId, followeeId: ben.userId });
      await ctx.db.insert("follows", { followerId: kim.userId, followeeId: ben.userId });
    });

    await t.mutation(internal.migrations.followsToRequests, {});
    await t.finishAllScheduledFunctions(() => {});

    const network = await ben.as.query(api.social.network, {});
    expect(network.friends.map((p) => p.username)).toEqual(["sam"]);
    expect(network.followers).toEqual([]);
    expect((await ben.as.query(api.social.requests, {})).map((p) => p.username)).toEqual(["kim"]);
  });
});
