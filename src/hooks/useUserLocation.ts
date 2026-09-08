import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { locationLogger as log } from "../logger";
import { errorMessage } from "../utils/errors";
import { requestLocationAccess, watchUserPosition } from "../utils/location";
import type { UserLocation } from "../types";

const POSITION_TIMEOUT_MS = 10_000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
  let tid: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    tid = setTimeout(() => resolve(null), ms);
  });
  // Losing the race doesn't cancel the timer — without this it keeps its
  // callback alive for the full `ms` after the position has already arrived.
  return Promise.race([promise, timeout]).finally(() => clearTimeout(tid));
};

type UserLocationState = {
  userLocation: UserLocation | null;
  error: string | null;
  /** Foreground permission is granted. Heading watchers need it as much as position does. */
  permissionGranted: boolean;
};

/**
 * The device's position, acquired in stages so the UI has something to show
 * early, then kept current for as long as the caller is mounted.
 */
export const useUserLocation = (): UserLocationState => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const positionSub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const access = await requestLocationAccess();
        if (cancelled) return;
        if (!access.ok) {
          setError(access.error);
          return;
        }
        setPermissionGranted(true);

        // Stage 0 — last known position: instant when available, may be stale
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (cancelled) return;
        if (lastKnown) {
          setUserLocation({ lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude });
        }

        // Stage 1 — fast Balanced fix, enough to trigger a first fetch
        const fastLoc = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          POSITION_TIMEOUT_MS,
        );
        if (cancelled) return;
        if (fastLoc) {
          setUserLocation({ lat: fastLoc.coords.latitude, lng: fastLoc.coords.longitude });
        } else if (!lastKnown) {
          setError("Couldn’t get a GPS fix. Make sure location is enabled and try again.");
          return;
        }

        // Stage 2 — stay subscribed. The first callback is the high-accuracy fix
        // that used to be a one-shot here; every one after it is what keeps the
        // bearing and the distance readout honest as the user walks.
        const sub = await watchUserPosition(setUserLocation);
        if (cancelled) {
          sub.remove();
          return;
        }
        positionSub.current = sub;
      } catch (e) {
        if (cancelled) return;
        log.warn("location failed", e);
        setError(errorMessage(e, "Failed to get location."));
      }
    })();

    return () => {
      cancelled = true;
      positionSub.current?.remove();
    };
  }, []);

  return { userLocation, error, permissionGranted };
};
