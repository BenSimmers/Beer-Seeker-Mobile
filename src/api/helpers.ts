import { GooglePlace, LiquorStore, Located } from "../types";
import { haversineDistance } from "../utils/geo";
import { asBoolean, asNumber, asRecord, asString } from "../utils/parse";

// Hermes doesn't reliably expose DOMException; this shape is what isAbort() checks for.
export const abortError = (): Error => Object.assign(new Error("Aborted"), { name: "AbortError" });

// 429 = rate limited, 5xx = server overloaded — both worth another attempt
export const isTransient = (status: number): boolean => status === 429 || status >= 500;

// Parsed, not asserted. Beyond dropping the cast, this is what stops a malformed
// or partial `location` from reaching haversineDistance and yielding a NaN
// distance that then sorts unpredictably and renders as "NaN m".
export const parsePlace = (value: unknown): GooglePlace | undefined => {
  const o = asRecord(value);
  if (!o) return undefined;

  const name = asString(asRecord(o.displayName)?.text);
  const location = asRecord(o.location);
  const latitude = asNumber(location?.latitude);
  const longitude = asNumber(location?.longitude);
  const hours = asRecord(o.currentOpeningHours);

  return {
    displayName: name != null ? { text: name } : undefined,
    location: latitude != null && longitude != null ? { latitude, longitude } : undefined,
    shortFormattedAddress: asString(o.shortFormattedAddress),
    primaryType: asString(o.primaryType),
    rating: asNumber(o.rating),
    userRatingCount: asNumber(o.userRatingCount),
    nationalPhoneNumber: asString(o.nationalPhoneNumber),
    currentOpeningHours: hours != null ? { openNow: asBoolean(hours.openNow) } : undefined,
  };
};

export const delay = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const onAbort = () => {
      clearTimeout(tid);
      reject(abortError());
    };
    const tid = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });

export const hasLocation = (p: GooglePlace): p is Located => p.location != null;

export const toStore = (
  p: Located,
  userLat: number,
  userLng: number,
  fallbackName: string,
): LiquorStore => ({
  name: p.displayName?.text ?? fallbackName,
  lat: p.location.latitude,
  lng: p.location.longitude,
  distance: haversineDistance(userLat, userLng, p.location.latitude, p.location.longitude),
  vicinity: p.shortFormattedAddress ?? "",
  rating: p.rating,
  ratingCount: p.userRatingCount,
  phone: p.nationalPhoneNumber,
  openNow: p.currentOpeningHours?.openNow,
});
