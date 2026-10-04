import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { FAVOURITES_LIMIT, favouriteRows, placeKey } from "./lib/favourites";
import { requireUserId } from "./lib/session";

const NAME_MAX = 200;
const VICINITY_MAX = 300;

const favouriteInput = v.object({
  name: v.string(),
  lat: v.number(),
  lng: v.number(),
  vicinity: v.string(),
  category: v.string(),
  savedAt: v.number(),
});

/**
 * Makes the server's copy of the caller's favourites match `places`, the full
 * list from their device. Only the differences are written.
 */
export const syncMine = mutation({
  args: { places: v.array(favouriteInput) },
  handler: async (ctx, { places }) => {
    const me = await requireUserId(ctx);
    if (places.length > FAVOURITES_LIMIT) {
      throw new ConvexError(`You can share at most ${FAVOURITES_LIMIT} favourites.`);
    }

    const wanted = new Map<string, (typeof places)[number]>();
    for (const p of places) {
      if (!(Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180)) {
        throw new ConvexError("A favourite has an invalid position.");
      }
      wanted.set(placeKey(p.lat, p.lng), {
        ...p,
        name: p.name.slice(0, NAME_MAX),
        vicinity: p.vicinity.slice(0, VICINITY_MAX),
      });
    }

    const existing = await favouriteRows(ctx, me);
    const have = new Set<string>();
    for (const row of existing) {
      if (wanted.has(row.key)) have.add(row.key);
      else await ctx.db.delete(row._id);
    }
    for (const [key, place] of wanted) {
      if (!have.has(key)) await ctx.db.insert("favouritePlaces", { userId: me, key, ...place });
    }
  },
});
