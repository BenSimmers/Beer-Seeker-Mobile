import { shortestDelta } from "./geo";

/** Structurally `Region` from react-native-maps, without the native dependency. */
export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Point = { lat: number; lng: number };

/** Padding multiplier so both the user and the store sit inside the viewport. */
const REGION_PADDING = 2.5;

export const MIN_DELTA = 0.01;

// A span wider than the globe is not a region MapKit will accept: it raises an
// NSException from setRegion:, which on iOS aborts the process rather than
// failing soft. Text search isn't radius-bound, so a target on another
// continent is an ordinary case, not a bad one — the span just stops growing.
export const MAX_LAT_DELTA = 160;
export const MAX_LNG_DELTA = 320;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Back into [-180, 180), so a midpoint across the antimeridian stays on the map. */
const wrapLongitude = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180;

const usable = (point: Point) => Number.isFinite(point.lat) && Number.isFinite(point.lng);

const pointRegion = (point: Point): MapRegion => ({
  latitude: Number.isFinite(point.lat) ? point.lat : 0,
  longitude: Number.isFinite(point.lng) ? point.lng : 0,
  latitudeDelta: MIN_DELTA,
  longitudeDelta: MIN_DELTA,
});

/** The viewport holding both points, clamped to what MapKit will accept. */
export const regionFor = (store: Point, user: Point): MapRegion => {
  // Falling back beats handing the map a NaN it would abort on.
  if (!usable(store)) return pointRegion(user);
  if (!usable(user)) return pointRegion(store);

  // Signed, so a pair either side of the antimeridian meets the short way
  // round rather than at the point opposite on the globe.
  const eastWest = shortestDelta(user.lng, store.lng);

  return {
    latitude: (store.lat + user.lat) / 2,
    longitude: wrapLongitude(user.lng + eastWest / 2),
    latitudeDelta: clamp(Math.abs(store.lat - user.lat) * REGION_PADDING, MIN_DELTA, MAX_LAT_DELTA),
    longitudeDelta: clamp(Math.abs(eastWest) * REGION_PADDING, MIN_DELTA, MAX_LNG_DELTA),
  };
};
