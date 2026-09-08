import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LiquorStore } from "../types";
import { readStoreCache, storeCacheKey, writeStoreCache } from "./storeCache";

const storage = vi.hoisted(() => ({
  getItem: vi.fn<(key: string) => Promise<string | null>>(),
  setItem: vi.fn<(key: string, value: string) => Promise<void>>(),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({ default: storage }));

const TTL_MS = 10 * 60 * 1000;

const store: LiquorStore = {
  name: "Bottle Shop",
  lat: 51.5,
  lng: -0.12,
  distance: 240,
  vicinity: "1 High St",
  rating: 4.5,
  ratingCount: 120,
  phone: "020 1234 5678",
  openNow: true,
};

// The module keeps a process-wide memory cache, so each test uses its own key.
let keyCounter = 0;
const freshKey = () => `test_key_${keyCounter++}`;

beforeEach(() => {
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("storeCacheKey", () => {
  it("buckets coordinates onto a two-decimal (~1.1 km) grid", () => {
    expect(storeCacheKey(51.5074, -0.1278, "liquor_store")).toBe(
      "places_cache_liquor_store_51.51,-0.13",
    );
    expect(storeCacheKey(51.5074, -0.1278, "liquor_store")).toBe(
      storeCacheKey(51.5099, -0.1301, "liquor_store"),
    );
  });

  it("separates cells that are more than a bucket apart", () => {
    expect(storeCacheKey(51.5074, -0.1278, "bar")).not.toBe(storeCacheKey(51.5274, -0.1278, "bar"));
  });

  it("separates the same cell under different filters", () => {
    expect(storeCacheKey(51.5074, -0.1278, "pub")).not.toBe(storeCacheKey(51.5074, -0.1278, "bar"));
    expect(storeCacheKey(51.5074, -0.1278, "all")).not.toBe(storeCacheKey(51.5074, -0.1278, "pub"));
  });
});

describe("writeStoreCache", () => {
  it("persists the store with a timestamp", async () => {
    const key = freshKey();
    await writeStoreCache(key, store);

    expect(storage.setItem).toHaveBeenCalledWith(key, JSON.stringify({ store, ts: Date.now() }));
  });

  it("swallows storage failures", async () => {
    storage.setItem.mockRejectedValue(new Error("disk full"));
    await expect(writeStoreCache(freshKey(), store)).resolves.toBeUndefined();
  });

  it("serves the write back from memory even when the disk write failed", async () => {
    const key = freshKey();
    storage.setItem.mockRejectedValue(new Error("disk full"));
    await writeStoreCache(key, store);

    await expect(readStoreCache(key)).resolves.toEqual(store);
    expect(storage.getItem).not.toHaveBeenCalled();
  });
});

describe("readStoreCache", () => {
  it("returns null when nothing is stored", async () => {
    await expect(readStoreCache(freshKey())).resolves.toBeNull();
  });

  it("returns a stored entry that is still within the TTL", async () => {
    const key = freshKey();
    storage.getItem.mockResolvedValue(JSON.stringify({ store, ts: Date.now() - TTL_MS + 1000 }));

    await expect(readStoreCache(key)).resolves.toEqual(store);
  });

  it("returns null once the entry is past the TTL", async () => {
    const key = freshKey();
    storage.getItem.mockResolvedValue(JSON.stringify({ store, ts: Date.now() - TTL_MS - 1 }));

    await expect(readStoreCache(key)).resolves.toBeNull();
  });

  it("re-reads from storage once a memory entry goes stale", async () => {
    const key = freshKey();
    await writeStoreCache(key, store);

    vi.setSystemTime(Date.now() + TTL_MS + 1);
    const fresher = { ...store, name: "Newer Shop" };
    storage.getItem.mockResolvedValue(JSON.stringify({ store: fresher, ts: Date.now() }));

    await expect(readStoreCache(key)).resolves.toEqual(fresher);
    expect(storage.getItem).toHaveBeenCalledWith(key);
  });

  it("hits storage only once for repeated reads of the same key", async () => {
    const key = freshKey();
    storage.getItem.mockResolvedValue(JSON.stringify({ store, ts: Date.now() }));

    await readStoreCache(key);
    await readStoreCache(key);

    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it("returns null for malformed JSON", async () => {
    storage.getItem.mockResolvedValue("{not json");
    await expect(readStoreCache(freshKey())).resolves.toBeNull();
  });

  it("returns null when a required field is missing or the wrong type", async () => {
    const cases = [
      { store: { ...store, name: undefined }, ts: Date.now() },
      { store: { ...store, lat: "51.5" }, ts: Date.now() },
      { store: { ...store, distance: null }, ts: Date.now() },
      { store, ts: "recently" },
      { ts: Date.now() },
      null,
    ];

    for (const entry of cases) {
      storage.getItem.mockResolvedValue(JSON.stringify(entry));
      await expect(readStoreCache(freshKey())).resolves.toBeNull();
    }
  });

  it("fills in defaults for optional fields it cannot trust", async () => {
    storage.getItem.mockResolvedValue(
      JSON.stringify({
        store: { name: "Bottle Shop", lat: 51.5, lng: -0.12, distance: 240, rating: "4.5" },
        ts: Date.now(),
      }),
    );

    await expect(readStoreCache(freshKey())).resolves.toEqual({
      name: "Bottle Shop",
      lat: 51.5,
      lng: -0.12,
      distance: 240,
      vicinity: "",
      rating: undefined,
      ratingCount: undefined,
      phone: undefined,
      openNow: undefined,
    });
  });

  it("returns null when storage itself throws", async () => {
    storage.getItem.mockRejectedValue(new Error("storage unavailable"));
    await expect(readStoreCache(freshKey())).resolves.toBeNull();
  });
});
