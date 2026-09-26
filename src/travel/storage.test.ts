import { beforeEach, describe, expect, it, vi } from "vitest";
import { readTravelOrigin, writeTravelOrigin } from "./storage";

const storage = vi.hoisted(() => ({
  getItem: vi.fn<(key: string) => Promise<string | null>>(),
  setItem: vi.fn<(key: string, value: string) => Promise<void>>(),
  removeItem: vi.fn<(key: string) => Promise<void>>(),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({ default: storage }));

const lisbon = { label: "Lisbon, Portugal", lat: 38.7223, lng: -9.1393, setAt: 1000 };

beforeEach(() => {
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
  storage.removeItem.mockResolvedValue(undefined);
});

describe("travel origin storage", () => {
  it("round-trips an origin", async () => {
    await writeTravelOrigin(lisbon);
    const [, written] = storage.setItem.mock.calls[0] ?? [];
    storage.getItem.mockResolvedValue(written ?? null);

    await expect(readTravelOrigin()).resolves.toEqual(lisbon);
  });

  it("reads as off when nothing has been stored", async () => {
    await expect(readTravelOrigin()).resolves.toBeNull();
  });

  it("reads a corrupt value as off rather than throwing at startup", async () => {
    storage.getItem.mockResolvedValue("{not json");
    await expect(readTravelOrigin()).resolves.toBeNull();
  });

  it("clears the key when turned off instead of storing null", async () => {
    await writeTravelOrigin(null);
    expect(storage.removeItem).toHaveBeenCalledWith("travel_origin_v1");
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
