import { describe, expect, it } from "vitest";
import { favouriteKey } from "../../favourites";
import type { NearbyPlace } from "../../types";
import { arrangePlaces, countByCategory } from "./arrangePlaces";

const place = (name: string, over: Partial<NearbyPlace> = {}): NearbyPlace => ({
  name,
  lat: name.charCodeAt(0),
  lng: 0,
  distance: 0,
  vicinity: `${name} St`,
  category: "bar",
  ...over,
});

const bar = place("Bar", { openNow: false });
const pub = place("Pub", { category: "pub", openNow: true });
const shop = place("Shop", { category: "liquor_store", vicinity: "High Rd" });
const places = [bar, pub, shop];

const none = new Set<string>();
const defaults = { filter: "all", search: "", openFirst: false, favouriteKeys: none } as const;

const names = (list: NearbyPlace[]) => list.map((p) => p.name);

describe("arrangePlaces", () => {
  it("keeps distance order when nothing is asked of it", () => {
    expect(names(arrangePlaces(places, defaults))).toEqual(["Bar", "Pub", "Shop"]);
  });

  it("filters by category", () => {
    expect(names(arrangePlaces(places, { ...defaults, filter: "pub" }))).toEqual(["Pub"]);
  });

  it("searches name and address, ignoring case and padding", () => {
    expect(names(arrangePlaces(places, { ...defaults, search: "  SHOP " }))).toEqual(["Shop"]);
    expect(names(arrangePlaces(places, { ...defaults, search: "high rd" }))).toEqual(["Shop"]);
  });

  it("lifts open places without reordering either group", () => {
    expect(names(arrangePlaces(places, { ...defaults, openFirst: true }))).toEqual([
      "Pub",
      "Bar",
      "Shop",
    ]);
  });

  it("puts favourites above open places", () => {
    const favouriteKeys = new Set([favouriteKey(shop)]);
    expect(names(arrangePlaces(places, { ...defaults, openFirst: true, favouriteKeys }))).toEqual([
      "Shop",
      "Pub",
      "Bar",
    ]);
  });
});

describe("countByCategory", () => {
  it("counts every place under all and each under its own category", () => {
    expect(countByCategory([...places, place("Other", { category: "other" })])).toEqual({
      all: 4,
      bar: 1,
      pub: 1,
      liquor_store: 1,
    });
  });
});
