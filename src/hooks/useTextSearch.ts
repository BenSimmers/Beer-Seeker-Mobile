import { useEffect, useRef, useState } from "react";
import { searchPlacesByText } from "../api/googlePlaces";
import { browseLogger as log } from "../logger";
import { NETWORK_ERROR, errorMessage, isAbort } from "../utils/errors";
import type { NearbyPlace, UserLocation } from "../types";

const DEBOUNCE_MS = 350;

/** Below this a query is too vague to be worth a billed request. */
export const MIN_QUERY_LENGTH = 3;

const NO_RESULTS: NearbyPlace[] = [];
const IDLE = { results: NO_RESULTS, error: null, loading: false } as const;

export const useTextSearch = (
  query: string,
  userLocation: UserLocation | null,
  enabled: boolean,
) => {
  const [results, setResults] = useState<NearbyPlace[]>(NO_RESULTS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef<AbortController | null>(null);

  // Held in a ref, not a dependency: the bias centre barely moves the results,
  // and re-running on every 10 m position update would bill for nothing.
  const locationRef = useRef(userLocation);
  useEffect(() => {
    locationRef.current = userLocation;
  }, [userLocation]);

  const trimmed = query.trim();
  const active = enabled && trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!active) return;

    const timer = setTimeout(async () => {
      const location = locationRef.current;
      if (!location) return;

      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      setLoading(true);
      setError(null);
      try {
        setResults(
          await searchPlacesByText(trimmed, location.lat, location.lng, controller.signal),
        );
      } catch (e) {
        if (isAbort(e)) return;
        log.debug("text search failed", e);
        setError(errorMessage(e, NETWORK_ERROR));
        setResults(NO_RESULTS);
      } finally {
        // Only the newest request owns the spinner, as in useGeoFetch.
        if (inFlight.current === controller) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [active, trimmed]);

  // A keystroke supersedes whatever was in flight; unmounting cancels it outright.
  useEffect(() => () => inFlight.current?.abort(), []);

  return active ? { results, error, loading } : IDLE;
};
