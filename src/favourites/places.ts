import { isPlaceCategory } from "../types";
import type { LiquorStore, PlaceCategory, StoreProvider } from "../types";
import { haversineDistance } from "../utils/geo";
import { asArray, asNumber, asRecord, asString } from "../utils/parse";

export type FavouritePlace = {
  name: string;
  lat: number;
  lng: number;
  vicinity: string;
  category: PlaceCategory | "other";
  rating?: number;
  phone?: string;
  savedAt: number;
};

export type FavouriteInput = Omit<FavouritePlace, "savedAt">;

export const favouriteKey = (place: { lat: number; lng: number }): string =>
  `${place.lat.toFixed(5)},${place.lng.toFixed(5)}`;

export const toFavourite = (
  place: FavouriteInput,
  savedAt: number = Date.now(),
): FavouritePlace => ({
  name: place.name,
  lat: place.lat,
  lng: place.lng,
  vicinity: place.vicinity,
  category: place.category,
  rating: place.rating,
  phone: place.phone,
  savedAt,
});

export const favouriteToStore = (
  place: FavouritePlace,
  userLat: number,
  userLng: number,
): LiquorStore => ({
  name: place.name,
  lat: place.lat,
  lng: place.lng,
  vicinity: place.vicinity,
  rating: place.rating,
  phone: place.phone,
  distance: haversineDistance(userLat, userLng, place.lat, place.lng),
});

export const favouriteStoreProvider =
  (place: FavouritePlace): StoreProvider =>
  (userLat, userLng) =>
    Promise.resolve(favouriteToStore(place, userLat, userLng));

const parseFavourite = (value: unknown): FavouritePlace | null => {
  const o = asRecord(value);
  if (!o) return null;

  const name = asString(o.name);
  const lat = asNumber(o.lat);
  const lng = asNumber(o.lng);
  if (name == null || lat == null || lng == null) return null;

  const category = asString(o.category);
  return {
    name,
    lat,
    lng,
    vicinity: asString(o.vicinity) ?? "",
    category: isPlaceCategory(category) ? category : "other",
    rating: asNumber(o.rating),
    phone: asString(o.phone),
    savedAt: asNumber(o.savedAt) ?? 0,
  };
};

export const parseFavourites = (value: unknown): FavouritePlace[] =>
  asArray(value)
    .flatMap((entry) => parseFavourite(entry) ?? [])
    .sort((a, b) => b.savedAt - a.savedAt);

export const favouritesFirst = <T extends { lat: number; lng: number }>(
  places: T[],
  keys: ReadonlySet<string>,
): T[] => {
  if (keys.size === 0) return places;
  const saved = places.filter((p) => keys.has(favouriteKey(p)));
  if (saved.length === 0 || saved.length === places.length) return places;
  return [...saved, ...places.filter((p) => !keys.has(favouriteKey(p)))];
};
