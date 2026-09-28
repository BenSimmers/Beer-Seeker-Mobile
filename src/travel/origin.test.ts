import { describe, expect, it } from "vitest";
import { parseTravelOrigin, travelToOrigin } from "./origin";

const lisbon = { label: "Lisbon, Portugal", lat: 38.7223, lng: -9.1393, setAt: 1000 };

describe("parseTravelOrigin", () => {
  it("reads back what was stored", () => {
    expect(parseTravelOrigin(lisbon)).toEqual(lisbon);
  });

  it("treats a missing timestamp as the epoch rather than rejecting the origin", () => {
    const rest = { label: lisbon.label, lat: lisbon.lat, lng: lisbon.lng };
    expect(parseTravelOrigin(rest)).toEqual({ ...rest, setAt: 0 });
  });

  it("reads anything it can't trust as not travelling", () => {
    expect(parseTravelOrigin(null)).toBeNull();
    expect(parseTravelOrigin("Lisbon")).toBeNull();
    expect(parseTravelOrigin({ ...lisbon, label: "" })).toBeNull();
    expect(parseTravelOrigin({ ...lisbon, lat: "38.7" })).toBeNull();
    expect(parseTravelOrigin({ ...lisbon, lng: Number.NaN })).toBeNull();
  });

  it("rejects coordinates that aren't on the planet", () => {
    expect(parseTravelOrigin({ ...lisbon, lat: 91 })).toBeNull();
    expect(parseTravelOrigin({ ...lisbon, lng: -181 })).toBeNull();
    expect(parseTravelOrigin({ ...lisbon, lat: -90, lng: 180 })).not.toBeNull();
  });
});

describe("travelToOrigin", () => {
  it("marks the origin as travel and carries its name", () => {
    expect(travelToOrigin(lisbon)).toEqual({
      lat: 38.7223,
      lng: -9.1393,
      source: "travel",
      label: "Lisbon, Portugal",
    });
  });
});
