import { useEffect, useMemo } from "react";
import { calculateBearing, haversineDistance } from "../utils/geo";
import { watchFusedHeading } from "../utils/heading";
import { compassLogger as log } from "../logger";
import { useCompassAnimation } from "./useCompassAnimation";
import { useGeoFetch } from "./useGeoFetch";
import { useUserLocation } from "./useUserLocation";
import type { StoreProvider } from "../types";

export const useCompass = (storeProvider: StoreProvider) => {
  const { userLocation, error: locationError, permissionGranted } = useUserLocation();
  const {
    data: store,
    error: fetchError,
    loading,
    refresh,
  } = useGeoFetch(userLocation, storeProvider, log);

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
