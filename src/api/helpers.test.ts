import { afterEach, describe, expect, it, vi } from "vitest";
import type { Located } from "../types";
import { isAbort } from "../utils/errors";
import { abortError, delay, hasLocation, isTransient, parsePlace, toStore } from "./helpers";

describe("abortError", () => {
  it("produces something isAbort() recognises", () => {
    const e = abortError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("AbortError");
    expect(isAbort(e)).toBe(true);
  });
});

describe("isTransient", () => {
  it("treats rate limits and server errors as retryable", () => {
    expect(isTransient(429)).toBe(true);
    expect(isTransient(500)).toBe(true);
    expect(isTransient(503)).toBe(true);
  });

  it("treats success and client errors as final", () => {
    expect(isTransient(200)).toBe(false);
    expect(isTransient(400)).toBe(false);
    expect(isTransient(403)).toBe(false);
    expect(isTransient(404)).toBe(false);
  });
});

describe("parsePlace", () => {
  const raw = {
    displayName: { text: "Bottle Shop" },
    location: { latitude: 51.5, longitude: -0.12 },
    shortFormattedAddress: "1 High St",
    primaryType: "liquor_store",
    rating: 4.5,
    userRatingCount: 120,
    nationalPhoneNumber: "020 1234 5678",
    currentOpeningHours: { openNow: true },
  };

  it("keeps every well-formed field", () => {
    expect(parsePlace(raw)).toEqual({
      displayName: { text: "Bottle Shop" },
      location: { latitude: 51.5, longitude: -0.12 },
      shortFormattedAddress: "1 High St",
      primaryType: "liquor_store",
      rating: 4.5,
      userRatingCount: 120,
      nationalPhoneNumber: "020 1234 5678",
      currentOpeningHours: { openNow: true },
    });
  });

  it("rejects values that are not objects", () => {
    expect(parsePlace(null)).toBeUndefined();
    expect(parsePlace("place")).toBeUndefined();
    expect(parsePlace([raw])).toBeUndefined();
  });

  it("drops a partial location rather than passing a half-coordinate on", () => {
    expect(parsePlace({ ...raw, location: { latitude: 51.5 } })?.location).toBeUndefined();
    expect(parsePlace({ ...raw, location: null })?.location).toBeUndefined();
  });

  it("drops a non-finite coordinate, which would otherwise become a NaN distance", () => {
    const place = parsePlace({ ...raw, location: { latitude: "51.5", longitude: -0.12 } });
    expect(place?.location).toBeUndefined();
  });

  it("drops fields of the wrong type instead of trusting them", () => {
    const place = parsePlace({
      ...raw,
      displayName: { text: 42 },
      rating: "4.5",
      userRatingCount: null,
      currentOpeningHours: { openNow: "yes" },
    });
    expect(place?.displayName).toBeUndefined();
    expect(place?.rating).toBeUndefined();
    expect(place?.userRatingCount).toBeUndefined();
    expect(place?.currentOpeningHours).toEqual({ openNow: undefined });
  });

  it("returns a place with everything undefined for an empty object", () => {
    expect(parsePlace({})).toEqual({
      displayName: undefined,
      location: undefined,
      shortFormattedAddress: undefined,
      primaryType: undefined,
      rating: undefined,
      userRatingCount: undefined,
      nationalPhoneNumber: undefined,
      currentOpeningHours: undefined,
    });
  });
});

describe("hasLocation", () => {
  it("narrows to places that carry coordinates", () => {
    expect(hasLocation({ location: { latitude: 1, longitude: 2 } })).toBe(true);
    expect(hasLocation({ displayName: { text: "no coords" } })).toBe(false);
  });
});

describe("toStore", () => {
  const place: Located = {
    displayName: { text: "Bottle Shop" },
    location: { latitude: 0, longitude: 1 },
    shortFormattedAddress: "1 High St",
    rating: 4.5,
    userRatingCount: 120,
    nationalPhoneNumber: "020 1234 5678",
    currentOpeningHours: { openNow: false },
  };

  it("maps the API shape onto our own, computing the distance", () => {
    const store = toStore(place, 0, 0, "Liquor Store");
    expect(store).toMatchObject({
      name: "Bottle Shop",
      lat: 0,
      lng: 1,
      vicinity: "1 High St",
      rating: 4.5,
      ratingCount: 120,
      phone: "020 1234 5678",
      openNow: false,
    });
    expect(store.distance).toBeCloseTo(111_195, 0);
  });

  it("falls back for a missing name and blanks a missing address", () => {
    const store = toStore({ location: { latitude: 0, longitude: 0 } }, 0, 0, "Liquor Store");
    expect(store.name).toBe("Liquor Store");
    expect(store.vicinity).toBe("");
    expect(store.distance).toBe(0);
  });
});

describe("delay", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves once the time has passed", async () => {
    vi.useFakeTimers();
    const settled = vi.fn();
    const promise = delay(2000, new AbortController().signal).then(settled);

    await vi.advanceTimersByTimeAsync(1999);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(settled).toHaveBeenCalled();
  });

  it("rejects immediately when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(delay(2000, controller.signal)).rejects.toSatisfy(isAbort);
  });

  it("rejects and clears its timer when aborted mid-wait", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const promise = delay(2000, controller.signal);

    await vi.advanceTimersByTimeAsync(500);
    controller.abort();

    await expect(promise).rejects.toSatisfy(isAbort);
    expect(vi.getTimerCount()).toBe(0);
  });
});
