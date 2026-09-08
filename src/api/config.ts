export const PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";

export const PLACES_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";

export const FIELD_MASK = [
  "places.displayName",
  "places.location",
  "places.shortFormattedAddress",
  "places.primaryType",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.currentOpeningHours.openNow",
].join(",") satisfies string;

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 2000;
export const RATE_LIMIT_DELAY_MS = 4000;
