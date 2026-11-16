import { cacheLogger as log } from "../logger";
import { jsonStore } from "../storage";
import { isPlaceCategory } from "../types";
import type { NearbyPlace } from "../types";
import { haversineDistance } from "../utils/geo";
import { asArray, asNumber, asRecord, asString } from "../utils/parse";

export const MAX_SAVED_PLACES = 500;

// Google's terms cap how long place data may be kept. Two days is well inside
// that, and still covers a night out or a weekend away from signal.
export const SAVED_PLACE_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

export type SavedPlace = NearbyPlace & {
  ts: number;
};

const savedKey = (p: { name: string; lat: number; lng: number }): string =>
  `${p.name}|${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;

const isCurrent = (place: SavedPlace, now: number): boolean =>
  now - place.ts <= SAVED_PLACE_MAX_AGE_MS;

export const mergeSaved = (
  existing: SavedPlace[],
  incoming: NearbyPlace[],
  now: number,
): SavedPlace[] => {
  const byKey = new Map<string, SavedPlace>();
  for (const place of incoming) byKey.set(savedKey(place), { ...place, ts: now });
  for (const place of existing) {
    const key = savedKey(place);
    if (!byKey.has(key) && isCurrent(place, now)) byKey.set(key, place);
  }
  return [...byKey.values()].sort((a, b) => b.ts - a.ts).slice(0, MAX_SAVED_PLACES);
};

const toNearby = ({ ts: _ts, ...place }: SavedPlace, lat: number, lng: number): NearbyPlace => ({
  ...place,
  openNow: undefined,
  distance: haversineDistance(lat, lng, place.lat, place.lng),
});

export const nearSaved = (
  saved: SavedPlace[],
  lat: number,
  lng: number,
  radius: number,
  now: number,
): NearbyPlace[] =>
  saved
    .filter((p) => isCurrent(p, now))
    .map((p) => toNearby(p, lat, lng))
    .filter((p) => p.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

export const matchSaved = (
  saved: SavedPlace[],
  query: string,
  lat: number,
  lng: number,
  now: number,
): NearbyPlace[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return saved
    .filter(
      (p) =>
        isCurrent(p, now) &&
        (p.name.toLowerCase().includes(needle) || p.vicinity.toLowerCase().includes(needle)),
    )
    .map((p) => toNearby(p, lat, lng))
    .sort((a, b) => a.distance - b.distance);
};

const parseSavedPlace = (value: unknown): SavedPlace | null => {
  const o = asRecord(value);
  if (!o) return null;

  const name = asString(o.name);
  const lat = asNumber(o.lat);
  const lng = asNumber(o.lng);
  const ts = asNumber(o.ts);
  if (name == null || lat == null || lng == null || ts == null) return null;

  const category = asString(o.category);
  return {
    name,
    lat,
    lng,
    ts,
    distance: 0, // Recomputed against the live position on the way out.
    vicinity: asString(o.vicinity) ?? "",
    category: isPlaceCategory(category) ? category : "other",
    rating: asNumber(o.rating),
    ratingCount: asNumber(o.ratingCount),
    phone: asString(o.phone),
  };
};

export const parseSavedPlaces = (value: unknown): SavedPlace[] =>
  asArray(value).flatMap((entry) => parseSavedPlace(entry) ?? []);

const NONE: SavedPlace[] = [];

const store = jsonStore<SavedPlace[]>({
  key: "saved_places_v1",
  parse: parseSavedPlaces,
  fallback: NONE,
  log,
});

let loaded: Promise<SavedPlace[]> | null = null;
const load = (): Promise<SavedPlace[]> => (loaded ??= store.read());

export const savePlaces = async (places: NearbyPlace[]): Promise<void> => {
  if (places.length === 0) return;
  const next = mergeSaved(await load(), places, Date.now());
  loaded = Promise.resolve(next);
  await store.write(next);
};

export const savedPlacesNear = async (
  lat: number,
  lng: number,
  radius: number,
): Promise<NearbyPlace[]> => nearSaved(await load(), lat, lng, radius, Date.now());

export const searchSavedPlaces = async (
  query: string,
  lat: number,
  lng: number,
): Promise<NearbyPlace[]> => matchSaved(await load(), query, lat, lng, Date.now());
