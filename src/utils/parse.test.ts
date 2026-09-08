import { describe, expect, it } from "vitest";
import { asArray, asBoolean, asNumber, asRecord, asString, isRecord } from "./parse";

describe("isRecord / asRecord", () => {
  it("accepts plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
  });

  it("rejects null, arrays and primitives", () => {
    for (const v of [null, undefined, [], [1], "x", 3, true]) {
      expect(isRecord(v)).toBe(false);
      expect(asRecord(v)).toBeUndefined();
    }
  });
});

describe("asString", () => {
  it("passes strings through, including empty ones", () => {
    expect(asString("hi")).toBe("hi");
    expect(asString("")).toBe("");
  });

  it("rejects non-strings", () => {
    for (const v of [1, null, undefined, {}, ["a"], true]) {
      expect(asString(v)).toBeUndefined();
    }
  });
});

describe("asNumber", () => {
  it("passes finite numbers through, including zero and negatives", () => {
    expect(asNumber(0)).toBe(0);
    expect(asNumber(-4.5)).toBe(-4.5);
  });

  it("rejects NaN and infinities", () => {
    expect(asNumber(NaN)).toBeUndefined();
    expect(asNumber(Infinity)).toBeUndefined();
    expect(asNumber(-Infinity)).toBeUndefined();
    expect(asNumber(JSON.parse("1e999"))).toBeUndefined();
  });

  it("rejects numeric strings", () => {
    expect(asNumber("3")).toBeUndefined();
  });
});

describe("asBoolean", () => {
  it("passes booleans through", () => {
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean(false)).toBe(false);
  });

  it("rejects truthy and falsy non-booleans", () => {
    expect(asBoolean(1)).toBeUndefined();
    expect(asBoolean(0)).toBeUndefined();
    expect(asBoolean("true")).toBeUndefined();
    expect(asBoolean(null)).toBeUndefined();
  });
});

describe("asArray", () => {
  it("passes arrays through", () => {
    const input = [1, "two"];
    expect(asArray(input)).toBe(input);
  });

  it("returns an empty array for anything else", () => {
    expect(asArray(undefined)).toEqual([]);
    expect(asArray({ length: 2 })).toEqual([]);
    expect(asArray("ab")).toEqual([]);
  });
});
