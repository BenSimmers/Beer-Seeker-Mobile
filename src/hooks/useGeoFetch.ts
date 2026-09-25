import { useCallback, useEffect, useRef, useState } from "react";
import { NETWORK_ERROR, errorMessage, isAbort } from "../utils/errors";
import { hasMovedBeyondThreshold } from "../utils/geo";
import type { UserLocation } from "../types";

/** `force` bypasses both the distance guard and any cache the fetcher keeps. */
export type GeoFetcher<T> = (
  lat: number,
  lng: number,
  signal: AbortSignal,
  force: boolean,
) => Promise<T>;

type Logger = { debug: (...args: unknown[]) => void };

/**
 * Runs a location-keyed fetch whenever the user moves far enough to justify it,
 * cancelling any request the move superseded.
 */
export const useGeoFetch = <T>(
  userLocation: UserLocation | null,
  fetcher: GeoFetcher<T>,
  log: Logger,
) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Tagged with the fetcher that asked: a new fetcher asks a different question
  // of the same position, so the movement guard — which only knows about
  // distance — must not swallow its first fetch.
  const lastFetched = useRef<{ fetcher: GeoFetcher<T>; location: UserLocation } | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const load = useCallback(
    async (lat: number, lng: number, force = false) => {
      const prev = lastFetched.current;
      const next = { lat, lng };
      // The position watch fires every 10 m; without this guard a walk would
      // turn into a fetch per step.
      if (!force && prev?.fetcher === fetcher && !hasMovedBeyondThreshold(prev.location, next)) {
        log.debug("skipping fetch — inside refetch threshold");
        return;
      }
      lastFetched.current = { fetcher, location: next };

      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      setLoading(true);
      setError(null);
      try {
        setData(await fetcher(lat, lng, controller.signal, force));
      } catch (e) {
        if (isAbort(e)) return;
        setError(errorMessage(e, NETWORK_ERROR));
      } finally {
        // Only the newest request owns the spinner — an aborted one clearing it
        // would report "done" while its replacement is still running.
        if (inFlight.current === controller) setLoading(false);
      }
    },
    [fetcher, log],
  );

  useEffect(() => {
    // Fetching is the external system this effect syncs with; the loading flag
    // it raises is part of starting that request, not derivable state.
    // oxlint-disable-next-line react/set-state-in-effect
    if (userLocation) load(userLocation.lat, userLocation.lng);
  }, [userLocation, load]);

  useEffect(() => () => inFlight.current?.abort(), []);

  const refresh = useCallback(() => {
    if (userLocation) load(userLocation.lat, userLocation.lng, true);
  }, [userLocation, load]);

  return { data, error, loading, refresh };
};
