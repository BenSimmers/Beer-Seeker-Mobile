import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonStore, typedStore } from "./typedStore";

const storage = vi.hoisted(() => ({
  getItem: vi.fn<(key: string) => Promise<string | null>>(),
  setItem: vi.fn<(key: string, value: string) => Promise<void>>(),
  removeItem: vi.fn<(key: string) => Promise<void>>(),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({ default: storage }));

const log = { warn: vi.fn() };

type Counter = { hits: number };

const parseCounter = (value: unknown): Counter | null =>
  typeof value === "object" && value !== null && typeof (value as Counter).hits === "number"
    ? { hits: (value as Counter).hits }
    : null;

const counters = jsonStore<Counter>({
  key: "counter_v1",
  parse: parseCounter,
  fallback: { hits: 0 },
  log,
});

const flag = typedStore<boolean>({
  key: "flag_v1",
  decode: (raw) => raw === "true",
  encode: (value) => (value ? "true" : "false"),
  fallback: false,
  log,
});

beforeEach(() => {
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
  storage.removeItem.mockResolvedValue(undefined);
});

describe("jsonStore", () => {
  it("round-trips a value through JSON", async () => {
    await counters.write({ hits: 3 });
    expect(storage.setItem).toHaveBeenCalledWith("counter_v1", '{"hits":3}');

    storage.getItem.mockResolvedValue('{"hits":3}');
    await expect(counters.read()).resolves.toEqual({ hits: 3 });
  });

  it("falls back when the key has never been written", async () => {
    await expect(counters.read()).resolves.toEqual({ hits: 0 });
  });

  it("falls back on unparseable JSON rather than throwing", async () => {
    storage.getItem.mockResolvedValue("{not json");
    await expect(counters.read()).resolves.toEqual({ hits: 0 });
    expect(log.warn).toHaveBeenCalled();
  });

  it("falls back when the JSON parses but fails validation", async () => {
    storage.getItem.mockResolvedValue('{"hits":"lots"}');
    await expect(counters.read()).resolves.toEqual({ hits: 0 });
  });

  it("falls back when the read itself fails", async () => {
    storage.getItem.mockRejectedValue(new Error("disk gone"));
    await expect(counters.read()).resolves.toEqual({ hits: 0 });
  });

  it("swallows a failed write — persistence is not worth a crash", async () => {
    storage.setItem.mockRejectedValue(new Error("disk full"));
    await expect(counters.write({ hits: 1 })).resolves.toBeUndefined();
    expect(log.warn).toHaveBeenCalled();
  });

  it("swallows a failed clear", async () => {
    storage.removeItem.mockRejectedValue(new Error("nope"));
    await expect(counters.clear()).resolves.toBeUndefined();
  });
});

describe("typedStore with a raw codec", () => {
  it("writes the bare string the shipped format expects", async () => {
    await flag.write(true);
    expect(storage.setItem).toHaveBeenCalledWith("flag_v1", "true");
  });

  it("reads a value written by an older build", async () => {
    storage.getItem.mockResolvedValue("true");
    await expect(flag.read()).resolves.toBe(true);
  });

  it("treats anything else as unset", async () => {
    storage.getItem.mockResolvedValue("yes");
    await expect(flag.read()).resolves.toBe(false);
  });

  it("removes the key on clear", async () => {
    await flag.clear();
    expect(storage.removeItem).toHaveBeenCalledWith("flag_v1");
  });
});
