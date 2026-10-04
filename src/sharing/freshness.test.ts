import { describe, expect, it } from "vitest";
import { IMPRECISE_ABOVE_M, STALE_AFTER_MS, describeFix, timeLeft } from "./freshness";

const NOW = 1_700_000_000_000;

describe("describeFix", () => {
  it("calls a fresh, precise fix live", () => {
    expect(describeFix({ updatedAt: NOW - 10_000, accuracy: 8 }, NOW)).toEqual({
      label: "Updated just now",
      warning: null,
      accuracyLabel: null,
    });
  });

  it("flags a wide accuracy radius", () => {
    expect(describeFix({ updatedAt: NOW, accuracy: IMPRECISE_ABOVE_M + 45 }, NOW)).toEqual({
      label: "Updated just now",
      warning: "imprecise",
      accuracyLabel: "±120 m",
    });
  });

  it("treats an unknown accuracy as fine", () => {
    expect(describeFix({ updatedAt: NOW, accuracy: null }, NOW).warning).toBeNull();
  });

  it("says 'last seen' once the fix is stale, even if it was imprecise", () => {
    const fix = describeFix({ updatedAt: NOW - STALE_AFTER_MS - 60_000, accuracy: 500 }, NOW);
    expect(fix.label).toBe("Last seen 3 min ago");
    expect(fix.warning).toBe("stale");
  });

  it("switches to hours", () => {
    expect(describeFix({ updatedAt: NOW - 125 * 60_000, accuracy: 5 }, NOW).label).toBe(
      "Last seen 2 h ago",
    );
  });

  it("doesn't go negative when clocks disagree", () => {
    expect(describeFix({ updatedAt: NOW + 5_000, accuracy: 5 }, NOW).label).toBe(
      "Updated just now",
    );
  });
});

describe("timeLeft", () => {
  it("rounds up to whole minutes", () => {
    expect(timeLeft(NOW + 30_000, NOW)).toBe("1 min left");
    expect(timeLeft(NOW + 52 * 60_000, NOW)).toBe("52 min left");
  });

  it("shows hours and leftover minutes", () => {
    expect(timeLeft(NOW + 60 * 60_000, NOW)).toBe("1 h left");
    expect(timeLeft(NOW + 190 * 60_000, NOW)).toBe("3 h 10 min left");
  });
});
