import { travelLogger as log } from "../logger";
import { jsonStore } from "../storage";
import { parseTravelOrigin } from "./origin";
import type { TravelOrigin } from "./origin";

const store = jsonStore<TravelOrigin | null>({
  key: "travel_origin_v1",
  parse: parseTravelOrigin,
  fallback: null,
  log,
});

export const readTravelOrigin = store.read;

export const writeTravelOrigin = (origin: TravelOrigin | null): Promise<void> =>
  origin ? store.write(origin) : store.clear();
