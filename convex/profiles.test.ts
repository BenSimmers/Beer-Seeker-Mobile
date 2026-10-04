// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type T = ReturnType<typeof convexTest>;

const makeUser = async (t: T, username: string) => {
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: `${username}@example.com` });
    const sessionId = await ctx.db.insert("authSessions", {
      userId,
      expirationTime: Date.now() + 60_000,
    });
    return { userId, sessionId };
  });
  const as = t.withIdentity({ subject: `${ids.userId}|${ids.sessionId}` });
  await as.mutation(api.profiles.create, { username, displayName: username });
  return { ...ids, as };
};

type User = Awaited<ReturnType<typeof makeUser>>;

const befriend = async (a: User, b: User) => {
  await a.as.mutation(api.social.follow, { userId: b.userId });
  await b.as.mutation(api.social.follow, { userId: a.userId });
};

const pub = (name: string, lat: number, savedAt = 1) => ({
  name,
  lat,
  lng: 151.2,
  vicinity: "Sydney",
  category: "pub",
  savedAt,
});

describe("profiles.view", () => {
  it("shows counts and relation", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const ali = await makeUser(t, "ali");
    await befriend(ben, sam);
    await ali.as.mutation(api.social.follow, { userId: ben.userId });

    const view = await sam.as.query(api.profiles.view, { userId: ben.userId });
    expect(view).toMatchObject({
      username: "ben",
      isYou: false,
      youFollow: true,
      followsYou: true,
      counts: { friends: 1, following: 1, followers: 2 },
      showFavourites: null,
    });
  });

  it("shows favourites to friends only, unless switched off", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const ali = await makeUser(t, "ali");
    await befriend(ben, sam);
    await ali.as.mutation(api.social.follow, { userId: ben.userId });
    await ben.as.mutation(api.favourites.syncMine, { places: [pub("The Lord Nelson", -33.86)] });

    const forSam = await sam.as.query(api.profiles.view, { userId: ben.userId });
    expect(forSam?.favourites?.map((f) => f.name)).toEqual(["The Lord Nelson"]);
    // Ali only follows Ben; that isn't enough.
    expect((await ali.as.query(api.profiles.view, { userId: ben.userId }))?.favourites).toBeNull();

    await ben.as.mutation(api.profiles.update, {
      displayName: "Ben",
      bio: "",
      showFavourites: false,
    });
    expect((await sam.as.query(api.profiles.view, { userId: ben.userId }))?.favourites).toBeNull();
    // Your own are always visible to you.
    const own = await ben.as.query(api.profiles.view, { userId: ben.userId });
    expect(own).toMatchObject({ isYou: true, showFavourites: false });
    expect(own?.favourites).toHaveLength(1);
  });
});

describe("profiles.update", () => {
  it("saves a tidied name and bio", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    await ben.as.mutation(api.profiles.update, {
      displayName: "  Ben   S ",
      bio: "  Pints and pool  ",
      showFavourites: true,
    });
    expect(await ben.as.query(api.profiles.view, { userId: ben.userId })).toMatchObject({
      displayName: "Ben S",
      bio: "Pints and pool",
    });
  });

  it("rejects a bio that's too long", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    await expect(
      ben.as.mutation(api.profiles.update, {
        displayName: "Ben",
        bio: "x".repeat(161),
        showFavourites: true,
      }),
    ).rejects.toThrow(/at most/);
  });
});

describe("social.connections", () => {
  it("lists someone else's friends relative to the caller", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const ali = await makeUser(t, "ali");
    await befriend(ben, sam);
    await befriend(ben, ali);
    await sam.as.mutation(api.social.follow, { userId: ali.userId });

    const list = await sam.as.query(api.social.connections, {
      userId: ben.userId,
      kind: "friends",
    });
    expect(list.map((p) => [p.username, p.isYou, p.youFollow, p.followsYou])).toEqual([
      ["ali", false, true, false],
      ["sam", true, false, false],
    ]);
  });
});

describe("favourites.syncMine", () => {
  it("adds and removes only what changed", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    await ben.as.mutation(api.favourites.syncMine, {
      places: [pub("A", -33.1, 1), pub("B", -33.2, 2)],
    });
    const firstIds = await t.run(async (ctx) =>
      (await ctx.db.query("favouritePlaces").collect()).map((r) => [r.name, r._id]),
    );

    await ben.as.mutation(api.favourites.syncMine, {
      places: [pub("B", -33.2, 2), pub("C", -33.3, 3)],
    });

    const own = await ben.as.query(api.profiles.view, { userId: ben.userId });
    expect(own?.favourites?.map((f) => f.name)).toEqual(["C", "B"]);
    const after = await t.run(async (ctx) => ctx.db.query("favouritePlaces").collect());
    // B was kept as-is rather than rewritten.
    expect(after.find((r) => r.name === "B")?._id).toBe(
      firstIds.find(([name]) => name === "B")?.[1],
    );
  });

  it("is removed with the account", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    await ben.as.mutation(api.favourites.syncMine, { places: [pub("A", -33.1)] });
    await ben.as.mutation(api.account.deleteAccount, {});
    const left = await t.run(
      async (ctx) => (await ctx.db.query("favouritePlaces").collect()).length,
    );
    expect(left).toBe(0);
  });
});

// Real uploads record the POST's Content-Type; convex-test leaves it off, so
// add it the way the backend would.
const storeFile = (t: T, contentType: string, bytes = 1024) =>
  t.run(async (ctx) => {
    const id = await ctx.storage.store(new Blob([new Uint8Array(bytes)]));
    await (ctx.db.patch as (id: string, value: object) => Promise<void>)(id, { contentType });
    return id;
  });

const fileCount = (t: T) =>
  t.run(async (ctx) => (await ctx.db.system.query("_storage").collect()).length);

describe("profile photos", () => {
  it("sets, replaces and removes a photo, deleting old files", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    await befriend(ben, sam);

    const first = await storeFile(t, "image/jpeg");
    await ben.as.mutation(api.profiles.setAvatar, { storageId: first });
    const view = await sam.as.query(api.profiles.view, { userId: ben.userId });
    expect(view?.avatarUrl).toEqual(expect.any(String));
    const friends = await sam.as.query(api.social.network, {});
    expect(friends.friends[0]?.avatarUrl).toEqual(view?.avatarUrl);

    const second = await storeFile(t, "image/png");
    await ben.as.mutation(api.profiles.setAvatar, { storageId: second });
    expect(await fileCount(t)).toBe(1);

    await ben.as.mutation(api.profiles.removeAvatar, {});
    expect(await fileCount(t)).toBe(0);
    expect((await ben.as.query(api.profiles.me, {}))?.avatarUrl).toBeNull();
  });

  it("rejects files that aren't small images, and deletes them", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const pdf = await storeFile(t, "application/pdf");
    expect(await ben.as.mutation(api.profiles.setAvatar, { storageId: pdf })).toMatch(
      /JPEG, PNG or WebP/,
    );
    const huge = await storeFile(t, "image/jpeg", 3 * 1024 * 1024);
    expect(await ben.as.mutation(api.profiles.setAvatar, { storageId: huge })).toMatch(
      /under 2 MB/,
    );
    expect((await ben.as.query(api.profiles.me, {}))?.avatarUrl).toBeNull();
    expect(await fileCount(t)).toBe(0);
  });

  it("won't let someone take another person's photo", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const photo = await storeFile(t, "image/jpeg");
    await ben.as.mutation(api.profiles.setAvatar, { storageId: photo });
    await expect(sam.as.mutation(api.profiles.setAvatar, { storageId: photo })).rejects.toThrow(
      /in use/,
    );
  });

  it("is deleted with the account", async () => {
    const t = convexTest(schema, modules);
    const ben = await makeUser(t, "ben");
    await ben.as.mutation(api.profiles.setAvatar, { storageId: await storeFile(t, "image/jpeg") });
    await ben.as.mutation(api.account.deleteAccount, {});
    expect(await fileCount(t)).toBe(0);
  });
});
