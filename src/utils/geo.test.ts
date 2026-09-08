import { describe, expect, it } from "vitest";
import {
  bearingToCardinal,
  calculateBearing,
  formatDistance,
  formatWalkTime,
  hasMovedBeyondThreshold,
  haversineDistance,
  REFETCH_THRESHOLD_M,
  shortestDelta,
  toRad,
  wrap360,
} from "./geo";

describe("toRad", () => {
  it("converts degrees to radians", () => {
    expect(toRad(0)).toBe(0);
    expect(toRad(180)).toBeCloseTo(Math.PI, 10);
    expect(toRad(-90)).toBeCloseTo(-Math.PI / 2, 10);
  });
});

describe("wrap360", () => {
  it("leaves values already in range untouched", () => {
    expect(wrap360(0)).toBe(0);
    expect(wrap360(359)).toBe(359);
  });

  it("wraps values above and below the range", () => {
    expect(wrap360(360)).toBe(0);
    expect(wrap360(450)).toBe(90);
    expect(wrap360(-10)).toBe(350);
    expect(wrap360(-730)).toBe(350);
  });
});

describe("shortestDelta", () => {
  it("takes the short way round the circle", () => {
    expect(shortestDelta(350, 10)).toBe(20);
    expect(shortestDelta(10, 350)).toBe(-20);
    expect(shortestDelta(0, 90)).toBe(90);
    expect(shortestDelta(0, 270)).toBe(-90);
  });

  it("stays within [-180, 180]", () => {
    for (let from = 0; from < 360; from += 17) {
      for (let to = 0; to < 360; to += 23) {
        const d = shortestDelta(from, to);
        expect(d).toBeGreaterThanOrEqual(-180);
        expect(d).toBeLessThanOrEqual(180);
        expect(wrap360(from + d)).toBeCloseTo(to, 10);
      }
    }
  });
});

describe("calculateBearing", () => {
  it("reports the cardinal directions from the equator", () => {
    expect(calculateBearing(0, 0, 1, 0)).toBeCloseTo(0, 6); // north
    expect(calculateBearing(0, 0, 0, 1)).toBeCloseTo(90, 6); // east
    expect(calculateBearing(0, 0, -1, 0)).toBeCloseTo(180, 6); // south
    expect(calculateBearing(0, 0, 0, -1)).toBeCloseTo(270, 6); // west
  });

  it("always returns a value in [0, 360)", () => {
    const bearing = calculateBearing(51.5074, -0.1278, 40.7128, -74.006); // London → New York
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
    expect(bearing).toBeCloseTo(288.0, 0);
  });
});

describe("haversineDistance", () => {
  it("is zero for the same point", () => {
    expect(haversineDistance(51.5, -0.12, 51.5, -0.12)).toBe(0);
  });

  it("measures one degree of longitude at the equator", () => {
    expect(haversineDistance(0, 0, 0, 1)).toBeCloseTo(111_195, 0);
  });

  it("is symmetric", () => {
    const there = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    const back = haversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
    expect(there).toBeCloseTo(back, 6);
    expect(there / 1000).toBeCloseTo(343.6, 1); // London → Paris
  });
});

describe("hasMovedBeyondThreshold", () => {
  const origin = { lat: 51.5074, lng: -0.1278 };

  it("is false for a small move", () => {
    expect(hasMovedBeyondThreshold(origin, { lat: 51.5079, lng: -0.1278 })).toBe(false);
  });

  it("is true once the threshold is met", () => {
    // ~1.1 km due north.
    expect(hasMovedBeyondThreshold(origin, { lat: 51.5174, lng: -0.1278 })).toBe(true);
  });

  it("uses REFETCH_THRESHOLD_M as an inclusive bound", () => {
    const metresPerDegLat = haversineDistance(0, 0, 1, 0);
    const to = { lat: origin.lat + REFETCH_THRESHOLD_M / metresPerDegLat, lng: origin.lng };
    expect(haversineDistance(origin.lat, origin.lng, to.lat, to.lng)).toBeGreaterThanOrEqual(
      REFETCH_THRESHOLD_M,
    );
    expect(hasMovedBeyondThreshold(origin, to)).toBe(true);
  });
});

describe("formatWalkTime", () => {
  it("never reports less than a minute", () => {
    expect(formatWalkTime(0)).toBe("1 min walk");
    expect(formatWalkTime(15)).toBe("1 min walk");
  });

  it("rounds to whole minutes at walking pace", () => {
    expect(formatWalkTime(80)).toBe("1 min walk");
    expect(formatWalkTime(400)).toBe("5 min walk");
    expect(formatWalkTime(4000)).toBe("50 min walk");
  });
});

describe("formatDistance", () => {
  it("renders whole metres below a kilometre", () => {
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(12.4)).toBe("12 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("renders one decimal of kilometres at and above 1000 m", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(1549)).toBe("1.5 km");
    expect(formatDistance(23_400)).toBe("23.4 km");
  });
});

describe("bearingToCardinal", () => {
  it("maps each octant to its point", () => {
    expect(bearingToCardinal(0)).toBe("N");
    expect(bearingToCardinal(45)).toBe("NE");
    expect(bearingToCardinal(90)).toBe("E");
    expect(bearingToCardinal(135)).toBe("SE");
    expect(bearingToCardinal(180)).toBe("S");
    expect(bearingToCardinal(225)).toBe("SW");
    expect(bearingToCardinal(270)).toBe("W");
    expect(bearingToCardinal(315)).toBe("NW");
  });

  it("rounds to the nearest point", () => {
    expect(bearingToCardinal(22)).toBe("N");
    expect(bearingToCardinal(23)).toBe("NE");
    expect(bearingToCardinal(350)).toBe("N");
  });

  it("normalises out-of-range bearings", () => {
    expect(bearingToCardinal(360)).toBe("N");
    expect(bearingToCardinal(-45)).toBe("NW");
    expect(bearingToCardinal(810)).toBe("E"); // 810 - 720 = 90
  });
});
