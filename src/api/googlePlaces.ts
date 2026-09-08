import { GOOGLE_MAPS_API_KEY, SEARCH_RADIUS_M } from "../config";
import { readStoreCache, storeCacheKey, writeStoreCache } from "../cache/storeCache";
import { placesLogger as log } from "../logger";
import { CATEGORY_LABELS, CATEGORY_PLURALS, PLACE_CATEGORIES, isPlaceCategory } from "../types";
import type {
  CategoryFilter,
  GooglePlace,
  LiquorStore,
  NearbyPlace,
  StoreProvider,
} from "../types";
import { NETWORK_ERROR, isAbort } from "../utils/errors";
import { asArray, asRecord } from "../utils/parse";
import {
  MAX_ATTEMPTS,
  PLACES_NEARBY_URL,
  PLACES_TEXT_URL,
  FIELD_MASK,
  RATE_LIMIT_DELAY_MS,
  RETRY_DELAY_MS,
} from "./config";
import { abortError, isTransient, delay, parsePlace, hasLocation, toStore } from "./helpers";

// Returns the last response even when every attempt failed, so the caller can
// report the real status instead of a generic network error.
async function postWithRetry(url: string, body: string, signal: AbortSignal): Promise<Response> {
  const t0 = Date.now();
  let last: Response | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (signal.aborted) throw abortError();
    try {
      last = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body,
        signal,
      });
      log.info(`attempt ${attempt} → ${last.status} in ${Date.now() - t0}ms`);
      if (!isTransient(last.status)) return last;
    } catch (e) {
      if (isAbort(e)) throw e;
      log.info(`attempt ${attempt} → network error in ${Date.now() - t0}ms`, e);
      last = null;
    }
    if (attempt < MAX_ATTEMPTS) {
      await delay(last?.status === 429 ? RATE_LIMIT_DELAY_MS : RETRY_DELAY_MS, signal);
    }
  }

  if (!last) throw new Error(NETWORK_ERROR);
  return last;
}

// Key guard, retries, status check, parse — everything both endpoints share.
async function requestPlaces(
  url: string,
  body: unknown,
  signal: AbortSignal,
): Promise<GooglePlace[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env.");
  }

  const res = await postWithRetry(url, JSON.stringify(body), signal);

  if (!res.ok) {
    log.warn(`Places HTTP ${res.status}`, await res.text().catch(() => ""));
    throw new Error(`Places HTTP ${res.status}`);
  }

  const parsed: unknown = await res.json();
  const places = asArray(asRecord(parsed)?.places).flatMap((p) => parsePlace(p) ?? []);
  log.info(`places returned: ${places.length}`);
  return places;
}

// Nearest-first results within SEARCH_RADIUS_M, across the given place types.
function searchNearby(
  userLat: number,
  userLng: number,
  includedTypes: readonly string[],
  maxResultCount: number,
  signal: AbortSignal,
): Promise<GooglePlace[]> {
  log.debug("nearby query", includedTypes);
  return requestPlaces(
    PLACES_NEARBY_URL,
    {
      includedTypes,
      maxResultCount,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: { center: { latitude: userLat, longitude: userLng }, radius: SEARCH_RADIUS_M },
      },
    },
    signal,
  );
}

const toNearbyPlaces = (places: GooglePlace[], userLat: number, userLng: number): NearbyPlace[] =>
  places
    .filter(hasLocation)
    .map(
      (p): NearbyPlace => ({
        ...toStore(p, userLat, userLng, "Unknown"),
        category: isPlaceCategory(p.primaryType) ? p.primaryType : "other",
      }),
    )
    .sort((a, b) => a.distance - b.distance);

/**
 * Nearest venue matching `filter`, cached per ~1 km grid cell.
 * `skipCache` forces a fresh fetch.
 */
export async function fetchNearestPlace(
  filter: CategoryFilter,
  userLat: number,
  userLng: number,
  signal: AbortSignal,
  skipCache = false,
): Promise<LiquorStore> {
  const key = storeCacheKey(userLat, userLng, filter);

  if (!skipCache) {
    const cached = await readStoreCache(key);
    if (cached) {
      log.debug("cache hit", key);
      return cached;
    }
  }

  const types = filter === "all" ? PLACE_CATEGORIES : [filter];
  const places = await searchNearby(userLat, userLng, types, 5, signal);

  const wanted = (p: GooglePlace) =>
    filter === "all" ? isPlaceCategory(p.primaryType) : p.primaryType === filter;

  const place = places.filter(hasLocation).find(wanted);
  if (!place) {
    throw new Error(`No ${CATEGORY_PLURALS[filter]} found within ${SEARCH_RADIUS_M / 1000} km.`);
  }

  const fallbackName = filter === "all" ? "Venue" : CATEGORY_LABELS[filter];
  const store = toStore(place, userLat, userLng, fallbackName);
  await writeStoreCache(key, store);
  return store;
}

/** Binds a filter so the result is the `StoreProvider` the compass hook expects. */
export const nearestPlaceProvider =
  (filter: CategoryFilter): StoreProvider =>
  (userLat, userLng, signal, skipCache) =>
    fetchNearestPlace(filter, userLat, userLng, signal, skipCache);

/** All nearby venues for the Browse screen's category filter. Always fresh — never cached. */
export async function fetchNearbyPlaces(
  userLat: number,
  userLng: number,
  signal: AbortSignal,
): Promise<NearbyPlace[]> {
  const places = await searchNearby(userLat, userLng, PLACE_CATEGORIES, 20, signal);
  return toNearbyPlaces(places, userLat, userLng);
}

/**
 * Name/keyword search. Where the nearby search *restricts* to SEARCH_RADIUS_M,
 * this only *biases* toward the user, so results can be any distance away.
 * Never cached — the query is the key here, not the grid cell.
 */
export async function searchPlacesByText(
  query: string,
  userLat: number,
  userLng: number,
  signal: AbortSignal,
): Promise<NearbyPlace[]> {
  log.debug("text query", query);
  // searchText takes a single includedType rather than a list, so categories are
  // applied afterwards instead: a search by name should find the thing you named,
  // whatever Google files it under.
  const places = await requestPlaces(
    PLACES_TEXT_URL,
    {
      textQuery: query,
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationBias: {
        circle: { center: { latitude: userLat, longitude: userLng }, radius: SEARCH_RADIUS_M },
      },
    },
    signal,
  );
  return toNearbyPlaces(places, userLat, userLng);
}
