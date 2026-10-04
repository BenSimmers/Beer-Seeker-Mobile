import { describe, expect, it } from "vitest";
import { base64ToBytes } from "./base64";

describe("base64ToBytes", () => {
  it("decodes to the original bytes", () => {
    // The first bytes of every JPEG: FF D8 FF.
    expect([...base64ToBytes("/9j/")]).toEqual([0xff, 0xd8, 0xff]);
  });

  it("handles padding and empty input", () => {
    expect([...base64ToBytes("aGk=")]).toEqual([0x68, 0x69]);
    expect(base64ToBytes("")).toHaveLength(0);
  });
});
