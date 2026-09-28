import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useUserLocation } from "./hooks/useUserLocation";
import { travelToOrigin, readTravelOrigin, writeTravelOrigin } from "./travel";
import type { TravelOrigin } from "./travel";
import type { Origin, UserLocation } from "./types";

type LocationValue = {
  origin: Origin | null;
  /** The real GPS position, even while travelling. */
  realLocation: UserLocation | null;
  permissionGranted: boolean;
  error: string | null;
  travelOrigin: TravelOrigin | null;
  setTravelOrigin: (place: Omit<TravelOrigin, "setAt">) => void;
  clearTravelOrigin: () => void;
};

const LocationContext = createContext<LocationValue | null>(null);

type LocationProviderProps = { children: React.ReactNode };

/** Mount inside the age gate: mounting requests location permission. */
export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const { userLocation, error: locationError, permissionGranted } = useUserLocation();
  const [travelOrigin, setTravelOriginState] = useState<TravelOrigin | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readTravelOrigin()
      .then((stored) => {
        if (!cancelled) setTravelOriginState(stored);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTravelOrigin = useCallback((place: Omit<TravelOrigin, "setAt">) => {
    const next = { ...place, setAt: Date.now() };
    setTravelOriginState(next);
    void writeTravelOrigin(next);
  }, []);

  const clearTravelOrigin = useCallback(() => {
    setTravelOriginState(null);
    void writeTravelOrigin(null);
  }, []);

  const origin = useMemo<Origin | null>(() => {
    if (travelOrigin) return travelToOrigin(travelOrigin);
    return userLocation ? { ...userLocation, source: "device", label: null } : null;
  }, [travelOrigin, userLocation]);

  // Travelling makes a missing fix irrelevant, but not a denied permission —
  // heading needs it on iOS.
  const error = travelOrigin && permissionGranted ? null : locationError;

  const value = useMemo(
    () => ({
      origin,
      realLocation: userLocation,
      permissionGranted,
      error,
      travelOrigin,
      setTravelOrigin,
      clearTravelOrigin,
    }),
    [
      origin,
      userLocation,
      permissionGranted,
      error,
      travelOrigin,
      setTravelOrigin,
      clearTravelOrigin,
    ],
  );

  if (!hydrated) return null;

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = (): LocationValue => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside a LocationProvider");
  return ctx;
};
