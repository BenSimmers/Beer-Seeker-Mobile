import { describe, expect, it } from "vitest";
import {
  DISPLAY_NAME_MAX,
  USERNAME_MAX,
  displayNameError,
  normalizeDisplayName,
  normalizeUsername,
  usernameError,
} from "./username";

describe("normalizeUsername", () => {
  it("trims, drops a leading @ and lowercases", () => {
    expect(normalizeUsername("  @Ben_S ")).toBe("ben_s");
  });

  it("only drops one leading @", () => {
    expect(normalizeUsername("@@ben")).toBe("@ben");
  });
});

describe("usernameError", () => {
  it("accepts letters, digits and underscores", () => {
    expect(usernameError("ben_42")).toBeNull();
  });

  it("rejects handles that are too short or too long", () => {
    expect(usernameError("ab")).toMatch(/at least/);
    expect(usernameError("a".repeat(USERNAME_MAX + 1))).toMatch(/at most/);
  });

  it("rejects other characters", () => {
    expect(usernameError("ben.s")).toMatch(/letters, numbers/);
    expect(usernameError("ben s")).toMatch(/letters, numbers/);
  });
});

describe("display names", () => {
  it("collapses whitespace", () => {
    expect(normalizeDisplayName("  Ben   Simmers ")).toBe("Ben Simmers");
  });

  it("requires something, within the limit", () => {
    expect(displayNameError("")).toMatch(/Add/);
    expect(displayNameError("a".repeat(DISPLAY_NAME_MAX + 1))).toMatch(/at most/);
    expect(displayNameError("Ben")).toBeNull();
  });
});
