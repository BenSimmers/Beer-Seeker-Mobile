import { describe, expect, it } from "vitest";
import { haversineDistance } from "../utils/geo";
import { crawlProgress } from "./progress";

const stops = [
  { lat: 0, lng: 0 },
  { lat: 0.001, lng: 0 },
  { lat: 0.003, lng: 0 },
];
const leg = haversineDistance(0, 0, 0.001, 0);

describe("crawlProgress", () => {
  it("measures each leg and the whole route", () => {
    const { legs, totalMetres } = crawlProgress(stops, null);
    expect(legs[0]).toBeCloseTo(leg);
    expect(legs[1]).toBeCloseTo(leg * 2);
    expect(totalMetres).toBeCloseTo(leg * 3);
  });

  it("counts progress by distance walked", () => {
    expect(crawlProgress(stops, null)).toMatchObject({ coveredMetres: 0, fraction: 0 });
    expect(crawlProgress(stops, 0)).toMatchObject({ coveredMetres: 0, fraction: 0 });
    expect(crawlProgress(stops, 1).fraction).toBeCloseTo(1 / 3);
    expect(crawlProgress(stops, 2).fraction).toBeCloseTo(1);
  });

  it("counts stops when there's no distance to go on", () => {
    const sameSpot = [stops[0]!, stops[0]!, stops[0]!];
    expect(crawlProgress(sameSpot, 1).fraction).toBe(0.5);
    expect(crawlProgress([stops[0]!], 0)).toMatchObject({ legs: [], totalMetres: 0, fraction: 1 });
    expect(crawlProgress([], null)).toMatchObject({ legs: [], totalMetres: 0, fraction: 0 });
  });
});
