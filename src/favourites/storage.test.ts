import { beforeEach, describe, expect, it, vi } from "vitest";
import { toFavourite } from "./places";
import { readFavourites, writeFavourites } from "./storage";

const storage = vi.hoisted(() => ({
  getItem: vi.fn<(key: string) => Promise<string | null>>(),
  setItem: vi.fn<(key: string, value: string) => Promise<void>>(),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({ default: storage }));

const favourite = toFavourite(
  {
    name: "Bottle Shop",
    lat: 51.5,
    lng: -0.12,
    vicinity: "1 High St",
    category: "liquor_store",
  },
  1000,
);

beforeEach(() => {
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
});

describe("favourites storage", () => {
  it("round-trips a saved list", async () => {
    await writeFavourites([favourite]);
    const [, written] = storage.setItem.mock.calls[0] ?? [];
    storage.getItem.mockResolvedValue(written ?? null);

    await expect(readFavourites()).resolves.toEqual([favourite]);
  });

  it("reads nothing when the list has never been written", async () => {
    await expect(readFavourites()).resolves.toEqual([]);
  });

  it("survives a corrupt list rather than throwing at startup", async () => {
    storage.getItem.mockResolvedValue("{not json");
    await expect(readFavourites()).resolves.toEqual([]);
  });

  it("swallows a failed write — a lost pin is not worth a crash", async () => {
    storage.setItem.mockRejectedValue(new Error("disk full"));
    await expect(writeFavourites([favourite])).resolves.toBeUndefined();
  });
});
