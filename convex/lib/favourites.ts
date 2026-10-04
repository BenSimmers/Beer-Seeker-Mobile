import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/** Far more than anyone pins; keeps a profile read and a sync bounded. */
export const FAVOURITES_LIMIT = 100;

export type SharedFavourite = {
  key: string;
  name: string;
  lat: number;
  lng: number;
  vicinity: string;
  category: string;
  savedAt: number;
};

/** Must match favouriteKey() in src/favourites/places.ts. */
export const placeKey = (lat: number, lng: number): string => `${lat.toFixed(5)},${lng.toFixed(5)}`;

export const favouriteRows = (ctx: QueryCtx, userId: Id<"users">) =>
  ctx.db
    .query("favouritePlaces")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(FAVOURITES_LIMIT);

/** Newest first, like the Favourites screen. */
export const listFavourites = async (
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<SharedFavourite[]> =>
  (await favouriteRows(ctx, userId))
    .sort((a, b) => b.savedAt - a.savedAt)
    .map(({ key, name, lat, lng, vicinity, category, savedAt }) => ({
      key,
      name,
      lat,
      lng,
      vicinity,
      category,
      savedAt,
    }));
