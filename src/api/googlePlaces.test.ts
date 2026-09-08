import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LiquorStore } from "../types";
import { NETWORK_ERROR, isAbort } from "../utils/errors";
import { MAX_ATTEMPTS, PLACES_NEARBY_URL, PLACES_TEXT_URL } from "./config";
import {
  fetchNearbyPlaces,
  fetchNearestPlace,
  nearestPlaceProvider,
  searchPlacesByText,
} from "./googlePlaces";

const cache = vi.hoisted(() => ({
  readStoreCache: vi.fn<(key: string) => Promise<LiquorStore | null>>(),
  writeStoreCache: vi.fn<(key: string, store: LiquorStore) => Promise<void>>(),
}));

vi.mock("../config", () => ({ GOOGLE_MAPS_API_KEY: "test-key", SEARCH_RADIUS_M: 5000 }));

vi.mock("../cache/storeCache", () => ({
  storeCacheKey: (lat: number, lng: number, filter: string) => `key_${filter}_${lat},${lng}`,
  readStoreCache: cache.readStoreCache,
  writeStoreCache: cache.writeStoreCache,
}));

const liquorStore = (over: Partial<LiquorStore> = {}): LiquorStore => ({
  name: "Bottle Shop",
  lat: 51.5,
  lng: -0.12,
  distance: 240,
  vicinity: "1 High St",
  ...over,
});

const place = (name: string, latitude: number, longitude: number, primaryType: string) => ({
  displayName: { text: name },
  location: { latitude, longitude },
  primaryType,
  shortFormattedAddress: `${name} address`,
});

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

const signal = () => new AbortController().signal;

// Most cases exercise the original liquor-store target; bind it once.
const fetchNearestStore = nearestPlaceProvider("liquor_store");

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  cache.readStoreCache.mockResolvedValue(null);
  cache.writeStoreCache.mockResolvedValue(undefined);
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("fetchNearestStore", () => {
  it("returns a cache hit without going to the network", async () => {
    const cached = liquorStore({ name: "Cached Shop" });
    cache.readStoreCache.mockResolvedValue(cached);

    await expect(fetchNearestStore(51.5, -0.12, signal())).resolves.toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips the cache when asked to", async () => {
    cache.readStoreCache.mockResolvedValue(liquorStore({ name: "Cached Shop" }));
    fetchMock.mockResolvedValue(
      jsonResponse({ places: [place("Fresh Shop", 0, 1, "liquor_store")] }),
    );

    const store = await fetchNearestStore(0, 0, signal(), true);

    expect(cache.readStoreCache).not.toHaveBeenCalled();
    expect(store.name).toBe("Fresh Shop");
  });

  it("sends the documented request and caches the result", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ places: [place("Fresh Shop", 0, 1, "liquor_store")] }),
    );

    const store = await fetchNearestStore(0, 0, signal());

    expect(store).toMatchObject({
      name: "Fresh Shop",
      lat: 0,
      lng: 1,
      vicinity: "Fresh Shop address",
    });
    expect(store.distance).toBeCloseTo(111_195, 0);
    expect(cache.writeStoreCache).toHaveBeenCalledWith("key_liquor_store_0,0", store);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(PLACES_NEARBY_URL);
    expect((init.headers as Record<string, string>)["X-Goog-Api-Key"]).toBe("test-key");
    expect(JSON.parse(init.body as string)).toEqual({
      includedTypes: ["liquor_store"],
      maxResultCount: 5,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: { center: { latitude: 0, longitude: 0 }, radius: 5000 },
      },
    });
  });

  it("takes the first place whose PRIMARY type is liquor_store", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        places: [
          { displayName: { text: "No Coordinates" }, primaryType: "liquor_store" },
          place("Corner Grocer", 0, 0.1, "grocery_store"),
          place("Bottle Shop", 0, 0.5, "liquor_store"),
          place("Further Bottle Shop", 0, 1, "liquor_store"),
        ],
      }),
    );

    const store = await fetchNearestStore(0, 0, signal());
    expect(store.name).toBe("Bottle Shop");
  });

  it("throws when nothing nearby is a liquor store", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ places: [place("Corner Grocer", 0, 0.1, "grocery_store")] }),
    );

    await expect(fetchNearestStore(0, 0, signal())).rejects.toThrow(
      "No liquor stores found within 5 km.",
    );
    expect(cache.writeStoreCache).not.toHaveBeenCalled();
  });

  it("asks only for the selected category and reports it by name when empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ places: [place("A Bar", 0, 0.1, "bar")] }));

    await expect(fetchNearestPlace("wine_bar", 0, 0, signal())).rejects.toThrow(
      "No wine bars found within 5 km.",
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ includedTypes: ["wine_bar"] });
  });

  it('takes the nearest place of any known category when the filter is "all"', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        places: [
          place("Corner Grocer", 0, 0.1, "grocery_store"),
          place("The Local", 0, 0.5, "pub"),
          place("Bottle Shop", 0, 1, "liquor_store"),
        ],
      }),
    );

    const store = await fetchNearestPlace("all", 0, 0, signal());

    expect(store.name).toBe("The Local");
    expect(cache.writeStoreCache).toHaveBeenCalledWith("key_all_0,0", store);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      includedTypes: ["liquor_store", "bar", "pub", "sports_bar", "brewery", "wine_bar"],
    });
  });

  it("caches each filter separately", async () => {
    cache.readStoreCache.mockResolvedValue(liquorStore({ name: "Cached Pub" }));

    await fetchNearestPlace("pub", 0, 0, signal());

    expect(cache.readStoreCache).toHaveBeenCalledWith("key_pub_0,0");
  });

  it("tolerates a response with no places array", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await expect(fetchNearestStore(0, 0, signal())).rejects.toThrow("No liquor stores found");
  });

  it("aborts before making a request when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(fetchNearestStore(0, 0, controller.signal)).rejects.toSatisfy(isAbort);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not retry a non-transient status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "denied" }, 403));

    await expect(fetchNearestStore(0, 0, signal())).rejects.toThrow("Places HTTP 403");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a transient status and succeeds", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(
        jsonResponse({ places: [place("Bottle Shop", 0, 1, "liquor_store")] }),
      );

    const promise = fetchNearestStore(0, 0, signal());
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toMatchObject({ name: "Bottle Shop" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gives up after MAX_ATTEMPTS and reports the real status", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse({}, 503));

    const promise = fetchNearestStore(0, 0, signal());
    const assertion = expect(promise).rejects.toThrow("Places HTTP 503");
    await vi.advanceTimersByTimeAsync(30_000);

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it("reports a network error when every attempt throws", async () => {
    vi.useFakeTimers();
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));

    const promise = fetchNearestStore(0, 0, signal());
    const assertion = expect(promise).rejects.toThrow(NETWORK_ERROR);
    await vi.advanceTimersByTimeAsync(30_000);

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it("propagates an abort raised by fetch itself without retrying", async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error("Aborted"), { name: "AbortError" }));

    await expect(fetchNearestStore(0, 0, signal())).rejects.toSatisfy(isAbort);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchNearbyPlaces", () => {
  it("returns every located place, nearest first, with a category", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        places: [
          place("Far Pub", 0, 1, "pub"),
          place("Near Brewery", 0, 0.2, "brewery"),
          place("Mystery Venue", 0, 0.5, "night_club"),
          { displayName: { text: "No Coordinates" }, primaryType: "bar" },
        ],
      }),
    );

    const places = await fetchNearbyPlaces(0, 0, signal());

    expect(places.map((p) => [p.name, p.category])).toEqual([
      ["Near Brewery", "brewery"],
      ["Mystery Venue", "other"],
      ["Far Pub", "pub"],
    ]);
    const distances = places.map((p) => p.distance);
    expect(distances).toEqual(distances.toSorted((a, b) => a - b));
  });

  it("asks for all the categories the Browse screen filters by", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ places: [] }));

    await expect(fetchNearbyPlaces(0, 0, signal())).resolves.toEqual([]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      includedTypes: ["liquor_store", "bar", "pub", "sports_bar", "brewery", "wine_bar"],
      maxResultCount: 20,
    });
  });

  it("never touches the store cache", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ places: [] }));

    await fetchNearbyPlaces(0, 0, signal());

    expect(cache.readStoreCache).not.toHaveBeenCalled();
    expect(cache.writeStoreCache).not.toHaveBeenCalled();
  });
});

describe("searchPlacesByText", () => {
  it("biases toward the user instead of restricting, so distant results survive", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ places: [place("Far Cellars", 0, 1, "liquor_store")] }),
    );

    const places = await searchPlacesByText("cellars", 0, 0, signal());

    expect(places).toHaveLength(1);
    expect(places[0]?.distance).toBeCloseTo(111_195, 0);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(PLACES_TEXT_URL);
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toMatchObject({ textQuery: "cellars", maxResultCount: 20 });
    expect(body.locationBias).toBeDefined();
    expect(body.locationRestriction).toBeUndefined();
  });

  it("keeps places outside the tracked categories, tagged as other", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        places: [
          place("Corner Grocer", 0, 0.5, "grocery_store"),
          place("The Local", 0, 0.2, "pub"),
        ],
      }),
    );

    const places = await searchPlacesByText("corner", 0, 0, signal());

    expect(places.map((p) => [p.name, p.category])).toEqual([
      ["The Local", "pub"],
      ["Corner Grocer", "other"],
    ]);
  });

  it("never touches the store cache", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ places: [] }));

    await searchPlacesByText("anything", 0, 0, signal());

    expect(cache.readStoreCache).not.toHaveBeenCalled();
    expect(cache.writeStoreCache).not.toHaveBeenCalled();
  });
});
