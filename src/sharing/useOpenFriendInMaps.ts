import { useConvex } from "convex/react";
import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { errorMessage } from "../backend";
import { useToast } from "../components/Toast";
import { openInMaps } from "../services/storeInteractions";
import { describeFix } from "./freshness";

type Friend = { userId: Id<"users">; displayName: string };

/** Looks up a sharing friend's latest position on tap and hands it to the Maps app. */
export const useOpenFriendInMaps = () => {
  const convex = useConvex();
  const toast = useToast();
  return useCallback(
    async ({ userId, displayName }: Friend) => {
      try {
        const result = await convex.query(api.location.friendLocation, { friendId: userId });
        if (!result) {
          return toast.show(`${displayName} isn't sharing their location right now.`);
        }
        if (!result.position) {
          return toast.show(`Waiting for ${displayName}'s phone to send a location.`);
        }
        const fix = describeFix(result.position, Date.now());
        if (fix.warning === "stale") {
          toast.show(`Showing where ${displayName} was: ${fix.label.toLowerCase()}.`, "warning");
        }
        await openInMaps({ name: displayName, ...result.position });
      } catch (err) {
        toast.show(
          errorMessage(err, "Couldn't get their location. Check your connection."),
          "error",
        );
      }
    },
    [convex, toast],
  );
};
