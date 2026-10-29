import type { Id } from "../../convex/_generated/dataModel";
import type { PushTarget } from "../../convex/lib/push";

/** The screen a notification's `data` points at, or null if it's not one of ours. */
export const parseTarget = (data: unknown): PushTarget | null => {
  if (typeof data !== "object" || data === null) return null;
  const { screen, groupId } = data as Record<string, unknown>;
  if (screen === "FriendsHome") return { screen };
  if (screen === "Group" && typeof groupId === "string" && groupId) {
    return { screen, groupId: groupId as Id<"groups"> };
  }
  return null;
};
