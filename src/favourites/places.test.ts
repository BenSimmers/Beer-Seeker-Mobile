import { describe, expect, it } from "vitest";
import type { NearbyPlace } from "../types";
import {
  favouriteKey,
  favouriteStoreProvider,
  favouriteToStore,
  favouritesFirst,
  parseFavourites,
  toFavourite,
} from "./places";
import type { FavouritePlace } from "./places";

const nearby: NearbyPlace = {
  name: "Bottle Shop",
  lat: 51.5,
  lng: -0.12,
  distance: 240,
  vicinity: "1 High St",
  category: "liquor_store",
  rating: 4.5,
  ratingCount: 120,
  phone: "020 1234 5678",
  openNow: true,
};

const saved = (over: Partial<FavouritePlace> = {}): FavouritePlace => ({
  ...toFavourite(nearby, 1000),
  ...over,
});

describe("favouriteKey", () => {
  it("is the same for positions inside a metre of each other", () => {
    expect(favouriteKey({ lat: 51.5, lng: -0.12 })).toBe(
      favouriteKey({ lat: 51.500000001, lng: -0.120000001 }),
    );
  });

  it("separates neighbouring places", () => {
    expect(favouriteKey({ lat: 51.5, lng: -0.12 })).not.toBe(
      favouriteKey({ lat: 51.5004, lng: -0.12 }),
    );
  });
});

describe("toFavourite", () => {
  it("keeps what stays true and drops what doesn't", () => {
    const favourite = toFavourite(nearby, 1234);
    expect(favourite).toEqual({
      name: "Bottle Shop",
      lat: 51.5,
      lng: -0.12,
      vicinity: "1 High St",
      category: "liquor_store",
      rating: 4.5,
      phone: "020 1234 5678",
      savedAt: 1234,
    });
    expect(favourite).not.toHaveProperty("distance");
    expect(favourite).not.toHaveProperty("openNow");
  });
});

describe("favouriteToStore", () => {
  it("measures the distance from where the user is now", () => {
    const store = favouriteToStore(saved(), 51.5, -0.12);
    expect(store.distance).toBeCloseTo(0, 5);
    expect(favouriteToStore(saved(), 51.51, -0.12).distance).toBeGreaterThan(1000);
  });

  it("provides the pinned place without a lookup", async () => {
    const place = saved();
    await expect(
      favouriteStoreProvider(place)(51.5, -0.12, new AbortController().signal),
    ).resolves.toMatchObject({ name: "Bottle Shop", lat: 51.5, lng: -0.12 });
  });
});

describe("parseFavourites", () => {
  it("reads newest first and skips entries it can't trust", () => {
    const parsed = parseFavourites([
      { ...saved(), name: "Older", savedAt: 1 },
      { name: "No position" },
      "nonsense",
      { ...saved(), name: "Newer", savedAt: 2 },
    ]);
    expect(parsed.map((f) => f.name)).toEqual(["Newer", "Older"]);
  });

  it("falls back on a category it no longer knows", () => {
    const [parsed] = parseFavourites([{ ...saved(), category: "nightclub" }]);
    expect(parsed?.category).toBe("other");
  });

  it("treats anything but a list as nothing saved", () => {
    expect(parseFavourites(null)).toEqual([]);
    expect(parseFavourites({ name: "Bottle Shop" })).toEqual([]);
  });
});

describe("favouritesFirst", () => {
  const a = { name: "a", lat: 1, lng: 1 };
  const b = { name: "b", lat: 2, lng: 2 };
  const c = { name: "c", lat: 3, lng: 3 };

  it("lifts saved places without disturbing the rest of the order", () => {
    const keys = new Set([favouriteKey(c)]);
    expect(favouritesFirst([a, b, c], keys).map((p) => p.name)).toEqual(["c", "a", "b"]);
  });

  it("keeps saved places in the order they were listed", () => {
    const keys = new Set([favouriteKey(b), favouriteKey(c)]);
    expect(favouritesFirst([a, b, c], keys).map((p) => p.name)).toEqual(["b", "c", "a"]);
  });

  it("returns the same list when there is nothing to lift", () => {
    const places = [a, b, c];
    expect(favouritesFirst(places, new Set())).toBe(places);
    expect(favouritesFirst(places, new Set([favouriteKey({ lat: 9, lng: 9 })]))).toBe(places);
    expect(favouritesFirst(places, new Set(places.map(favouriteKey)))).toBe(places);
  });
});
