import { describe, expect, it } from "vitest";
import { CATEGORY_LABELS, PLACE_CATEGORIES, isPlaceCategory } from "./types";

describe("isPlaceCategory", () => {
  it("accepts every category we search for", () => {
    for (const category of PLACE_CATEGORIES) {
      expect(isPlaceCategory(category)).toBe(true);
    }
  });

  it("rejects unknown types and undefined", () => {
    expect(isPlaceCategory("restaurant")).toBe(false);
    expect(isPlaceCategory("")).toBe(false);
    expect(isPlaceCategory(undefined)).toBe(false);
  });

  it("does not match inherited Object keys", () => {
    expect(isPlaceCategory("constructor")).toBe(false);
    expect(isPlaceCategory("toString")).toBe(false);
  });
});

describe("CATEGORY_LABELS", () => {
  it("labels every category", () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...PLACE_CATEGORIES].sort());
    for (const label of Object.values(CATEGORY_LABELS)) {
      expect(label).not.toBe("");
    }
  });
});
