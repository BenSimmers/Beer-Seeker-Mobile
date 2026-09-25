import { favouritesLogger as log } from "../logger";
import { jsonStore } from "../storage";
import { parseFavourites } from "./places";
import type { FavouritePlace } from "./places";

const NONE: FavouritePlace[] = [];

const store = jsonStore<FavouritePlace[]>({
  key: "favourite_places_v1",
  parse: parseFavourites,
  fallback: NONE,
  log,
});

export const readFavourites = store.read;
export const writeFavourites = store.write;
