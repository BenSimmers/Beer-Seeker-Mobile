import { useMemo } from "react";
import { fetchNearbyPlaces } from "../api/googlePlaces";
import { browseLogger as log } from "../logger";
import { haversineDistance } from "../utils/geo";
import { useGeoFetch } from "./useGeoFetch";
import { useLocation } from "../location";
import type { NearbyPlace } from "../types";

// Stable identity so the `livePlaces` memo doesn't recompute on every render
// while the first fetch is still in flight.
const NO_PLACES: NearbyPlace[] = [];

export const useNearbyPlaces = () => {
  const { origin: userLocation, error: locationError } = useLocation();
  const {
    data,
    error: fetchError,
    loading,
    refresh,
  } = useGeoFetch(userLocation, fetchNearbyPlaces, log);

  const places = data ?? NO_PLACES;

  // Distances are fixed at fetch time, but the user keeps walking — recompute
  // against the live position so the list stays ordered and honest.
  const livePlaces = useMemo(() => {
    if (!userLocation) return places;
    return places
      .map((p) => ({
        ...p,
        distance: haversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [places, userLocation]);

  return {
    places: livePlaces,
    userLocation,
    // A location failure means the fetch never ran, so it's the more useful of the two.
    error: locationError ?? fetchError,
    loading,
    refresh,
  };
};
