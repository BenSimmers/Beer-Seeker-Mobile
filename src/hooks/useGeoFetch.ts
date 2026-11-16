import { useCallback, useEffect, useRef, useState } from "react";
import { NETWORK_ERROR, errorMessage, isAbort } from "../utils/errors";
import { useOnline } from "../network";
import { hasMovedBeyondThreshold } from "../utils/geo";
import type { Origin, UserLocation } from "../types";

type GeoFetcher<T> = (lat: number, lng: number, signal: AbortSignal, force: boolean) => Promise<T>;

type Logger = { debug: (...args: unknown[]) => void };

/**
 * Runs a location-keyed fetch whenever the user moves far enough to justify it runnin
 */
export const useGeoFetch = <T>(origin: Origin | null, fetcher: GeoFetcher<T>, log: Logger) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastFetched = useRef<{
    fetcher: GeoFetcher<T>;
    source: Origin["source"];
    location: UserLocation;
  } | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const online = useOnline();
  const onlineRef = useRef(online);
  const refreshOnReconnect = useRef(false);

  const load = useCallback(
    async ({ lat, lng, source }: Origin, force = false) => {
      const prev = lastFetched.current;
      const next = { lat, lng };
      // The position watch fires every 10 m; without this guard a walk would
      // turn into a fetch per step.
      if (
        !force &&
        prev?.fetcher === fetcher &&
        prev.source === source &&
        !hasMovedBeyondThreshold(prev.location, next)
      ) {
        log.debug("skipping fetch — inside refetch threshold");
        return;
      }
      lastFetched.current = { fetcher, source, location: next };

      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      const startedOffline = !onlineRef.current;
      setLoading(true);
      setError(null);
      try {
        setData(await fetcher(lat, lng, controller.signal, force));
        refreshOnReconnect.current = startedOffline || !onlineRef.current;
      } catch (e) {
        if (isAbort(e)) return;
        refreshOnReconnect.current = true;
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
    const reconnected = online && !onlineRef.current;
    onlineRef.current = online;
    if (!reconnected || !refreshOnReconnect.current || !origin) return;
    refreshOnReconnect.current = false;
    lastFetched.current = null;
    // oxlint-disable-next-line react/set-state-in-effect
    load(origin);
  }, [online, origin, load]);

  useEffect(() => {
    // Fetching is the external system this effect syncs with; the loading flag
    // it raises is part of starting that request, not derivable state.
    // oxlint-disable-next-line react/set-state-in-effect
    if (origin) load(origin);
  }, [origin, load]);

  useEffect(() => () => inFlight.current?.abort(), []);

  const refresh = useCallback(() => {
    if (origin) load(origin, true);
  }, [origin, load]);

  return { data, error, loading, refresh };
};
