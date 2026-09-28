import { beforeEach, describe, expect, it, vi } from "vitest";
import { GEOCODE_FAILED, geocodePlace, placeLabel } from "./geocode";

const location = vi.hoisted(() => ({
  geocodeAsync: vi.fn(),
  reverseGeocodeAsync: vi.fn(),
}));

vi.mock("expo-location", () => location);

const lisbon = { latitude: 38.7223, longitude: -9.1393 };
const address = { city: "Lisbon", subregion: "Lisboa", region: "Lisbon", country: "Portugal" };

beforeEach(() => {
  location.geocodeAsync.mockResolvedValue([lisbon]);
  location.reverseGeocodeAsync.mockResolvedValue([address]);
});

describe("placeLabel", () => {
  it("names the city and country", () => {
    expect(placeLabel(address)).toBe("Lisbon, Portugal");
  });

  it("falls back to wider areas when there is no city", () => {
    expect(placeLabel({ ...address, city: null })).toBe("Lisboa, Portugal");
    expect(placeLabel({ ...address, city: null, subregion: null })).toBe("Lisbon, Portugal");
  });

  it("gets by on whatever parts exist", () => {
    expect(placeLabel({ city: null, subregion: null, region: null, country: "Portugal" })).toBe(
      "Portugal",
    );
    expect(placeLabel({ city: null, subregion: null, region: null, country: null })).toBeNull();
  });
});

describe("geocodePlace", () => {
  it("resolves a query to coordinates and a canonical name", async () => {
    await expect(geocodePlace("lisbon")).resolves.toEqual({
      label: "Lisbon, Portugal",
      lat: 38.7223,
      lng: -9.1393,
    });
    expect(location.geocodeAsync).toHaveBeenCalledWith("lisbon");
  });

  it("doesn't ask the geocoder about blank input", async () => {
    await expect(geocodePlace("   ")).resolves.toBeNull();
    expect(location.geocodeAsync).not.toHaveBeenCalled();
  });

  it("returns null when nothing matches", async () => {
    location.geocodeAsync.mockResolvedValue([]);
    await expect(geocodePlace("asdfgh")).resolves.toBeNull();
  });

  it("throws a readable message when the geocoder throws", async () => {
    location.geocodeAsync.mockRejectedValue(new Error("GEOCODING_FAILED"));
    await expect(geocodePlace("asdfgh")).rejects.toThrow(GEOCODE_FAILED);
  });

  it("falls back to the typed query when naming the place fails", async () => {
    location.reverseGeocodeAsync.mockRejectedValue(new Error("offline"));
    await expect(geocodePlace("  lisbon ")).resolves.toMatchObject({ label: "lisbon" });

    location.reverseGeocodeAsync.mockResolvedValue([]);
    await expect(geocodePlace("lisbon")).resolves.toMatchObject({ label: "lisbon" });
  });
});
