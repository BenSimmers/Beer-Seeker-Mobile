import * as Location from "expo-location";
import { travelLogger as log } from "../logger";

export type GeocodeResult = { label: string; lat: number; lng: number };

export const GEOCODE_FAILED =
  "Couldn’t look that up. Check the spelling and your connection, then try again.";

type AddressParts = Pick<
  Location.LocationGeocodedAddress,
  "city" | "subregion" | "region" | "country"
>;

export const placeLabel = (place: AddressParts): string | null => {
  const locality = place.city ?? place.subregion ?? place.region;
  const parts = [locality, place.country].filter((p): p is string => !!p);
  return parts.length > 0 ? parts.join(", ") : null;
};

/** Null when nothing matches; throws a user-facing message on failure. */
export const geocodePlace = async (query: string): Promise<GeocodeResult | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  let matches: Location.LocationGeocodedLocation[];
  try {
    matches = await Location.geocodeAsync(trimmed);
  } catch (e) {
    // Thrown for both offline and some no-match inputs, indistinguishably.
    log.warn("geocode failed", e);
    throw new Error(GEOCODE_FAILED, { cause: e });
  }

  const [match] = matches;
  if (!match) return null;

  const label = await Location.reverseGeocodeAsync(match)
    .then(([place]) => (place ? placeLabel(place) : null))
    .catch((e) => {
      log.warn("reverse geocode failed, falling back to the query", e);
      return null;
    });

  return { label: label ?? trimmed, lat: match.latitude, lng: match.longitude };
};
