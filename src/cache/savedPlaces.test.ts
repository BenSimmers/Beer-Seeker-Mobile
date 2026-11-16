import { describe, expect, it, vi } from "vitest";
import type { NearbyPlace } from "../types";
import {
  MAX_SAVED_PLACES,
  SAVED_PLACE_MAX_AGE_MS,
  matchSaved,
  mergeSaved,
  nearSaved,
  parseSavedPlaces,
  type SavedPlace,
} from "./savedPlaces";

vi.mock("@react-native-async-storage/async-storage", () => ({ default: {} }));

const NOW = Date.UTC(2026, 0, 1);

const place = (over: Partial<NearbyPlace> = {}): NearbyPlace => ({
  name: "Bottle Shop",
  lat: 0,
  lng: 0,
  distance: 0,
  vicinity: "1 High St",
  category: "liquor_store",
  ...over,
});

const savedAt = (ts: number, over: Partial<NearbyPlace> = {}): SavedPlace => ({
  ...place(over),
  ts,
});

describe("mergeSaved", () => {
  it("stamps incoming places and keeps the ones already saved", () => {
    const merged = mergeSaved([savedAt(NOW - 1000, { name: "Old Pub" })], [place()], NOW);

    expect(merged.map((p) => [p.name, p.ts])).toEqual([
      ["Bottle Shop", NOW],
      ["Old Pub", NOW - 1000],
    ]);
  });

  it("replaces the saved copy of a place that comes in again", () => {
    const merged = mergeSaved([savedAt(NOW - 1000, { rating: 3 })], [place({ rating: 4.5 })], NOW);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ rating: 4.5, ts: NOW });
  });

  it("drops saved places past the maximum age", () => {
    const merged = mergeSaved(
      [savedAt(NOW - SAVED_PLACE_MAX_AGE_MS - 1, { name: "Expired" })],
      [place()],
      NOW,
    );

    expect(merged.map((p) => p.name)).toEqual(["Bottle Shop"]);
  });

  it("caps the collection, letting the oldest go first", () => {
    const existing = Array.from({ length: MAX_SAVED_PLACES }, (_, i) =>
      savedAt(NOW - 1000 - i, { name: `Place ${i}` }),
    );

    const merged = mergeSaved(existing, [place({ name: "Newest" })], NOW);

    expect(merged).toHaveLength(MAX_SAVED_PLACES);
    expect(merged[0]?.name).toBe("Newest");
    expect(merged.some((p) => p.name === `Place ${MAX_SAVED_PLACES - 1}`)).toBe(false);
  });
});

describe("nearSaved", () => {
  const saved = [
    savedAt(NOW, { name: "Far", lng: 1 }),
    savedAt(NOW, { name: "Near", lng: 0.01, openNow: true }),
    savedAt(NOW, { name: "Nearer", lng: 0.001 }),
    savedAt(NOW - SAVED_PLACE_MAX_AGE_MS - 1, { name: "Expired", lng: 0.002 }),
  ];

  it("returns the current places inside the radius, nearest first", () => {
    const near = nearSaved(saved, 0, 0, 5000, NOW);

    expect(near.map((p) => p.name)).toEqual(["Nearer", "Near"]);
    expect(near[1]?.distance).toBeCloseTo(1112, 0);
  });

  it("forgets whether a place was open and strips the timestamp", () => {
    const [, near] = nearSaved(saved, 0, 0, 5000, NOW);

    expect(near?.openNow).toBeUndefined();
    expect(near).not.toHaveProperty("ts");
  });
});

describe("matchSaved", () => {
  const saved = [
    savedAt(NOW, { name: "Far Cellars", lng: 1 }),
    savedAt(NOW, { name: "The Local", vicinity: "2 Cellar Lane", lng: 0.01 }),
    savedAt(NOW, { name: "Bottle Shop" }),
  ];

  it("matches name or address at any distance, nearest first", () => {
    expect(matchSaved(saved, " CELLAR ", 0, 0, NOW).map((p) => p.name)).toEqual([
      "The Local",
      "Far Cellars",
    ]);
  });

  it("returns nothing for a blank query", () => {
    expect(matchSaved(saved, "  ", 0, 0, NOW)).toEqual([]);
  });
});

describe("parseSavedPlaces", () => {
  it("keeps valid entries and drops malformed ones", () => {
    const parsed = parseSavedPlaces([
      { name: "Bottle Shop", lat: 1, lng: 2, ts: NOW, category: "pub", rating: "4" },
      { name: "No Timestamp", lat: 1, lng: 2 },
      { lat: 1, lng: 2, ts: NOW },
      null,
    ]);

    expect(parsed).toEqual([
      {
        name: "Bottle Shop",
        lat: 1,
        lng: 2,
        ts: NOW,
        distance: 0,
        vicinity: "",
        category: "pub",
        rating: undefined,
        ratingCount: undefined,
        phone: undefined,
      },
    ]);
  });

  it("returns nothing for a value that is not a list", () => {
    expect(parseSavedPlaces({})).toEqual([]);
  });
});
