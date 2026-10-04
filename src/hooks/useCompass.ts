import { useEffect, useMemo } from "react";
import { calculateBearing, haversineDistance } from "../utils/geo";
import { watchFusedHeading } from "../utils/heading";
import { compassLogger as log } from "../logger";
import { useCompassAnimation } from "./useCompassAnimation";
import { useGeoFetch } from "./useGeoFetch";
import { useLocation } from "../location";
import type { LiquorStore, StoreProvider } from "../types";

/**
 * Points at whatever `storeProvider` finds near the user — or, when
 * `liveTarget` is given, at that instead. A live target moves on its own (a
 * friend sharing their location), so nothing is fetched while one is set;
 * `null` means "live, but no position yet".
 */
export const useCompass = (storeProvider: StoreProvider, liveTarget?: LiquorStore | null) => {
  const { origin: userLocation, error: locationError, permissionGranted } = useLocation();
  const live = liveTarget !== undefined;
  const fetched = useGeoFetch(live ? null : userLocation, storeProvider, log);
  const store = live ? liveTarget : fetched.data;
  const fetchError = live ? null : fetched.error;
  const loading = live ? false : fetched.loading;
  const { refresh } = fetched;

  // Absolute bearing to the store. Only moves when the target or our position
  // does; the heading samples do the rest.
  const bearing = useMemo(
    () =>
      store && userLocation
        ? calculateBearing(userLocation.lat, userLocation.lng, store.lat, store.lng)
        : null,
    [store, userLocation],
  );

  const { needleAngle, dialAngle, onHeading } = useCompassAnimation(bearing);

  // iOS gates heading on location permission, so this waits for the grant —
  // but it is otherwise independent of the position stream. Keeping it its own
  // effect means a sensor failure can't take the position watch down with it.
  useEffect(() => {
    if (!permissionGranted) return;
    let cancelled = false;
    let watcher: { remove: () => void } | null = null;

    watchFusedHeading(onHeading)
      .then((w) => {
        if (cancelled) w.remove();
        else watcher = w;
      })
      .catch((e) => log.warn("heading unavailable", e));

    return () => {
      cancelled = true;
      watcher?.remove();
    };
  }, [permissionGranted, onHeading]);

  // `store.distance` is fixed at fetch time, and we deliberately don't refetch
  // until REFETCH_THRESHOLD_M — so recompute it against the live position rather
  // than let the readout sit on the distance from wherever the fetch happened.
  const liveStore = useMemo(() => {
    if (!store || !userLocation) return store;
    return {
      ...store,
      distance: haversineDistance(userLocation.lat, userLocation.lng, store.lat, store.lng),
    };
  }, [store, userLocation]);

  return {
    userLocation,
    needleAngle,
    dialAngle,
    store: liveStore,
    error: locationError ?? fetchError,
    loading,
    refresh,
  };
};
