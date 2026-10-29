import { describe, expect, it } from "vitest";
import { parseTarget } from "./target";

describe("parseTarget", () => {
  it("reads the screens a push can open", () => {
    expect(parseTarget({ screen: "FriendsHome" })).toEqual({ screen: "FriendsHome" });
    expect(parseTarget({ screen: "Group", groupId: "g1" })).toEqual({
      screen: "Group",
      groupId: "g1",
    });
  });

  it("ignores anything else", () => {
    expect(parseTarget(undefined)).toBeNull();
    expect(parseTarget("FriendsHome")).toBeNull();
    expect(parseTarget({ screen: "Group" })).toBeNull();
    expect(parseTarget({ screen: "Settings" })).toBeNull();
  });
});
