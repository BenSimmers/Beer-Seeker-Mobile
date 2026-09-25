import { describe, expect, it } from "vitest";
import { MAX_LAT_DELTA, MAX_LNG_DELTA, MIN_DELTA, regionFor } from "./mapRegion";

const sydney = { lat: -33.8688, lng: 151.2093 };
const london = { lat: 51.5074, lng: -0.1278 };

describe("regionFor", () => {
  it("frames a nearby store around the midpoint", () => {
    const store = { lat: -33.87, lng: 151.21 };
    const region = regionFor(store, sydney);
    expect(region.latitude).toBeCloseTo((store.lat + sydney.lat) / 2, 6);
    expect(region.longitude).toBeCloseTo((store.lng + sydney.lng) / 2, 6);
  });

  it("never zooms closer than the floor", () => {
    const region = regionFor(sydney, sydney);
    expect(region.latitudeDelta).toBe(MIN_DELTA);
    expect(region.longitudeDelta).toBe(MIN_DELTA);
  });

  // A span wider than the globe is what MapKit aborts the process over, and a
  // favourite on another continent is an ordinary target here.
  it("keeps a half-world span inside what MapKit accepts", () => {
    const region = regionFor(london, sydney);
    expect(region.latitudeDelta).toBeLessThanOrEqual(MAX_LAT_DELTA);
    expect(region.longitudeDelta).toBeLessThanOrEqual(MAX_LNG_DELTA);
    expect(region.latitudeDelta).toBeGreaterThan(0);
  });

  it("stays inside the limits for the two furthest-apart points on Earth", () => {
    const region = regionFor({ lat: 90, lng: 180 }, { lat: -90, lng: -180 });
    expect(region.latitudeDelta).toBe(MAX_LAT_DELTA);
    expect(region.longitudeDelta).toBeLessThanOrEqual(MAX_LNG_DELTA);
    expect(region.longitude).toBeGreaterThanOrEqual(-180);
    expect(region.longitude).toBeLessThan(180);
  });

  it("meets across the antimeridian the short way", () => {
    // 10 km apart either side of the date line — not 358° apart.
    const region = regionFor({ lat: 0, lng: 179.9 }, { lat: 0, lng: -179.9 });
    expect(region.longitudeDelta).toBeLessThan(1);
    expect(Math.abs(region.longitude)).toBeCloseTo(180, 4);
  });

  it("falls back rather than handing the map a NaN", () => {
    expect(regionFor({ lat: Number.NaN, lng: 151 }, sydney)).toEqual({
      latitude: sydney.lat,
      longitude: sydney.lng,
      latitudeDelta: MIN_DELTA,
      longitudeDelta: MIN_DELTA,
    });
    expect(regionFor(sydney, { lat: 0, lng: Number.POSITIVE_INFINITY })).toEqual({
      latitude: sydney.lat,
      longitude: sydney.lng,
      latitudeDelta: MIN_DELTA,
      longitudeDelta: MIN_DELTA,
    });
  });

  it("returns finite numbers whatever it is given", () => {
    for (const region of [
      regionFor(london, sydney),
      regionFor({ lat: Number.NaN, lng: Number.NaN }, { lat: Number.NaN, lng: Number.NaN }),
    ]) {
      for (const value of Object.values(region)) expect(Number.isFinite(value)).toBe(true);
    }
  });
});
