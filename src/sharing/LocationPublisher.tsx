import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { useLocation } from "../location";
import { sharingLogger as log } from "../logger";
import type { UserLocation } from "../types";

// The position watch already fires at most every 10 m / 5 s; this stops a
// burst of fixes turning into a burst of writes.
const MIN_SEND_INTERVAL_MS = 5_000;

// Standing still produces no new fixes, so resend now and then. Otherwise a
// friend watching would see "last seen 5 min ago" for someone who hasn't moved.
const HEARTBEAT_MS = 30_000;

/**
 * Sends the device's real GPS position (never a travel-mode origin) while the
 * user shares with at least one friend. Foreground only: it stops when the
 * app is backgrounded, and a friend's view goes stale accordingly.
 */
export const LocationPublisher: React.FC = () => {
  const { isAuthenticated } = useConvexAuth();
  const shares = useQuery(api.location.shares, isAuthenticated ? {} : "skip");
  const sharing = (shares?.outgoing.length ?? 0) > 0;
  const { realLocation } = useLocation();
  const publish = useMutation(api.location.publishLocation);
  const lastSentAt = useRef(0);
  const latest = useRef<UserLocation | null>(null);

  const send = useCallback(
    (loc: UserLocation) => {
      lastSentAt.current = Date.now();
      publish({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy }).catch((e) =>
        log.warn("publish failed", e),
      );
    },
    [publish],
  );

  useEffect(() => {
    latest.current = realLocation;
    if (!sharing || !realLocation) return;
    if (Date.now() - lastSentAt.current < MIN_SEND_INTERVAL_MS) return;
    send(realLocation);
  }, [sharing, realLocation, send]);

  useEffect(() => {
    if (!sharing) return;
    const id = setInterval(() => {
      if (latest.current) send(latest.current);
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [sharing, send]);

  return null;
};
