import { useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { LiquorStore } from "../types";
import { describeFix, type FixQuality } from "./freshness";
import { useNow } from "./useNow";

/** A friend to point at. Lives in navigation params, so it stays serialisable. */
export type FriendRef = { userId: Id<"users">; name: string };

export type FriendTracking =
  | { status: "loading" }
  /** Not sharing with you, or stopped. */
  | { status: "ended" }
  /** Sharing, but their phone hasn't sent a fix yet. */
  | { status: "waiting" }
  | { status: "live"; target: LiquorStore; fix: FixQuality };

const LABEL_REFRESH_MS = 15_000;

type Props = { friend: FriendRef; onChange: (tracking: FriendTracking) => void };

/**
 * Subscribes to a friend's shared position and reports it up as a compass
 * target. A component rather than a hook so the compass screen only touches
 * Convex when a friend is picked — builds without a backend have no client.
 */
export const FriendTracker: React.FC<Props> = ({ friend, onChange }) => {
  const result = useQuery(api.location.friendLocation, { friendId: friend.userId });
  const now = useNow(LABEL_REFRESH_MS);

  useEffect(() => {
    if (result === undefined) return onChange({ status: "loading" });
    if (result === null) return onChange({ status: "ended" });
    const { position } = result;
    if (!position) return onChange({ status: "waiting" });
    const fix = describeFix(position, now);
    onChange({
      status: "live",
      fix,
      target: {
        name: friend.name,
        lat: position.lat,
        lng: position.lng,
        // useCompass recomputes this against the live position.
        distance: 0,
        vicinity: fix.accuracyLabel ? `${fix.label} · ${fix.accuracyLabel}` : fix.label,
      },
    });
  }, [result, now, friend.name, onChange]);

  return null;
};
