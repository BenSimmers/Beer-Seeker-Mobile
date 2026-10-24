// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { makeFriends, makeUser, newTest, type T, type User } from "./test.helpers";

const place = (name: string, lat: number) => ({
  name,
  lat,
  lng: 0,
  vicinity: `${name} St`,
  category: "pub",
});

/** Ben and Sam in a group with three stops planned. */
const setup = async (t: T) => {
  const { ben, sam } = await makeFriends(t);
  const groupId = await ben.as.mutation(api.groups.create, { name: "g", memberIds: [sam.userId] });
  await sam.as.mutation(api.groups.respond, { groupId, accept: true });
  const ids: Id<"crawlStops">[] = [];
  for (const [i, name] of ["Crown", "Anchor", "Swan"].entries()) {
    ids.push(await ben.as.mutation(api.crawl.addStop, { groupId, place: place(name, i * 0.01) }));
  }
  return { ben, sam, groupId, ids };
};

const route = async (u: User, groupId: Id<"groups">) => {
  const crawl = await u.as.query(api.crawl.get, { groupId });
  return crawl && { names: crawl.stops.map((s) => s.name), at: crawl.currentIndex };
};

describe("crawl", () => {
  it("is shared with the whole group, in order", async () => {
    const t = newTest();
    const { sam, groupId, ids } = await setup(t);

    expect(await route(sam, groupId)).toEqual({ names: ["Crown", "Anchor", "Swan"], at: null });
    await sam.as.mutation(api.crawl.moveStop, { stopId: ids[2]!, by: -1 });
    expect(await route(sam, groupId)).toMatchObject({ names: ["Crown", "Swan", "Anchor"] });
    // Moving past either end does nothing.
    await sam.as.mutation(api.crawl.moveStop, { stopId: ids[0]!, by: -1 });
    expect(await route(sam, groupId)).toMatchObject({ names: ["Crown", "Swan", "Anchor"] });
  });

  it("tracks where the group is, and moves on when that stop is removed", async () => {
    const t = newTest();
    const { ben, sam, groupId, ids } = await setup(t);

    await sam.as.mutation(api.crawl.setCurrent, { groupId, stopId: ids[1]! });
    expect(await route(ben, groupId)).toMatchObject({ at: 1 });

    await ben.as.mutation(api.crawl.removeStop, { stopId: ids[1]! });
    expect(await route(sam, groupId)).toEqual({ names: ["Crown", "Swan"], at: 1 });

    await ben.as.mutation(api.crawl.removeStop, { stopId: ids[2]! });
    expect(await route(sam, groupId)).toEqual({ names: ["Crown"], at: 0 });

    await ben.as.mutation(api.crawl.setCurrent, { groupId, stopId: null });
    expect(await route(sam, groupId)).toMatchObject({ at: null });
  });

  it("refuses duplicates and outsiders", async () => {
    const t = newTest();
    const { groupId, ids } = await setup(t);
    const zed = await makeUser(t, "zed");

    const other = await zed.as.mutation(api.groups.create, { name: "z", memberIds: [] });
    await zed.as.mutation(api.crawl.addStop, { groupId: other, place: place("Elsewhere", 1) });

    await expect(
      zed.as.mutation(api.crawl.addStop, { groupId, place: place("Crown", 0) }),
    ).rejects.toThrow(/not in that group/);
    await expect(zed.as.mutation(api.crawl.removeStop, { stopId: ids[0]! })).rejects.toThrow(
      /not in that group/,
    );
    expect(await zed.as.query(api.crawl.get, { groupId })).toBeNull();
    // A stop from another group can't be made current.
    await expect(
      zed.as.mutation(api.crawl.setCurrent, { groupId: other, stopId: ids[0]! }),
    ).rejects.toThrow(/no longer on the crawl/);
  });

  it("preserves completion for everyone and explicitly restarts", async () => {
    const t = newTest();
    const { ben, sam, groupId, ids } = await setup(t);
    const outsider = await makeUser(t, "outsider");
    await expect(outsider.as.mutation(api.crawl.finish, { groupId })).rejects.toThrow(
      /not in that group/,
    );
    await expect(ben.as.mutation(api.crawl.finish, { groupId })).rejects.toThrow(/final stop/);
    await ben.as.mutation(api.crawl.setCurrent, { groupId, stopId: ids[2]! });
    await sam.as.mutation(api.crawl.finish, { groupId });
    expect(await ben.as.query(api.crawl.get, { groupId })).toMatchObject({
      completed: true,
      currentIndex: 2,
    });
    expect(await route(sam, groupId)).toMatchObject({ names: ["Crown", "Anchor", "Swan"] });
    await sam.as.mutation(api.crawl.setCurrent, { groupId, stopId: null });
    expect(await ben.as.query(api.crawl.get, { groupId })).toMatchObject({
      completed: false,
      currentIndex: null,
    });
  });

  it("reopens a completed crawl when the route changes", async () => {
    const t = newTest();
    const { ben, sam, groupId, ids } = await setup(t);
    await ben.as.mutation(api.crawl.setCurrent, { groupId, stopId: ids[2]! });
    await ben.as.mutation(api.crawl.finish, { groupId });
    await sam.as.mutation(api.crawl.addStop, { groupId, place: place("New pub", 1) });
    expect(await ben.as.query(api.crawl.get, { groupId })).toMatchObject({
      completed: false,
      currentIndex: 2,
    });
  });

  it("goes when the group does", async () => {
    const t = newTest();
    const { ben, sam, groupId } = await setup(t);

    await expect(
      sam.as.mutation(api.crawl.addStop, { groupId, place: place("Crown again", 0) }),
    ).rejects.toThrow(/already on the crawl/);

    await ben.as.mutation(api.groups.remove, { groupId });
    expect(await t.run((ctx) => ctx.db.query("crawlStops").collect())).toEqual([]);
  });
});
