import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { CRAWL_STOPS_MAX, stopsOf } from "./lib/crawl";
import { placeKey } from "./lib/favourites";
import { requireMembership, rowFor } from "./lib/groups";
import { requireUserId } from "./lib/session";

const NAME_MAX = 200;
const VICINITY_MAX = 300;

export type CrawlStop = {
  stopId: Id<"crawlStops">;
  name: string;
  lat: number;
  lng: number;
  vicinity: string;
  category: string;
};

export type Crawl = {
  stops: CrawlStop[];
  currentIndex: number | null;
  completed: boolean;
};

const requireStop = async (ctx: QueryCtx, stopId: Id<"crawlStops">) => {
  const stop = await ctx.db.get(stopId);
  if (!stop) throw new ConvexError("That stop is no longer on the crawl.");
  return { stop, ...(await requireMembership(ctx, stop.groupId)) };
};

export const get = query({
  args: { groupId: v.id("groups") },
  returns: v.union(
    v.null(),
    v.object({
      stops: v.array(
        v.object({
          stopId: v.id("crawlStops"),
          name: v.string(),
          lat: v.number(),
          lng: v.number(),
          vicinity: v.string(),
          category: v.string(),
        }),
      ),
      currentIndex: v.union(v.number(), v.null()),
      completed: v.boolean(),
    }),
  ),
  handler: async (ctx, { groupId }): Promise<Crawl | null> => {
    const me = await requireUserId(ctx);
    const [group, row] = await Promise.all([ctx.db.get(groupId), rowFor(ctx, groupId, me)]);
    if (!group || row?.status !== "member") return null;
    const stops = (await stopsOf(ctx, groupId)).map(
      (s): CrawlStop => ({
        stopId: s._id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        vicinity: s.vicinity,
        category: s.category,
      }),
    );
    const at = stops.findIndex((s) => s.stopId === group.currentStopId);
    return { stops, currentIndex: at === -1 ? null : at, completed: group.crawlCompleted ?? false };
  },
});

export const addStop = mutation({
  args: {
    groupId: v.id("groups"),
    place: v.object({
      name: v.string(),
      lat: v.number(),
      lng: v.number(),
      vicinity: v.string(),
      category: v.string(),
    }),
  },
  returns: v.id("crawlStops"),
  handler: async (ctx, { groupId, place }): Promise<Id<"crawlStops">> => {
    const { me } = await requireMembership(ctx, groupId);
    if (!(Math.abs(place.lat) <= 90 && Math.abs(place.lng) <= 180)) {
      throw new ConvexError("That place has an invalid position.");
    }
    const name = place.name.trim().slice(0, NAME_MAX);
    if (!name) throw new ConvexError("That place has no name.");

    const stops = await stopsOf(ctx, groupId);
    if (stops.length >= CRAWL_STOPS_MAX) {
      throw new ConvexError(`A crawl can have up to ${CRAWL_STOPS_MAX} stops.`);
    }
    const key = placeKey(place.lat, place.lng);
    if (stops.some((s) => placeKey(s.lat, s.lng) === key)) {
      throw new ConvexError(`${name} is already on the crawl.`);
    }
    await ctx.db.patch(groupId, { crawlCompleted: false });
    return await ctx.db.insert("crawlStops", {
      groupId,
      position: (stops.at(-1)?.position ?? -1) + 1,
      name,
      lat: place.lat,
      lng: place.lng,
      vicinity: place.vicinity.slice(0, VICINITY_MAX),
      category: place.category,
      addedBy: me,
    });
  },
});

export const removeStop = mutation({
  args: { stopId: v.id("crawlStops") },
  returns: v.null(),
  handler: async (ctx, { stopId }) => {
    const { stop, group } = await requireStop(ctx, stopId);
    if (group.currentStopId === stopId) {
      const stops = await stopsOf(ctx, group._id);
      const i = stops.findIndex((s) => s._id === stopId);
      const next = stops[i + 1] ?? stops[i - 1];
      await ctx.db.patch(group._id, { currentStopId: next?._id });
    }
    await ctx.db.patch(group._id, { crawlCompleted: false });
    await ctx.db.delete(stop._id);
  },
});

export const moveStop = mutation({
  args: { stopId: v.id("crawlStops"), by: v.union(v.literal(-1), v.literal(1)) },
  returns: v.null(),
  handler: async (ctx, { stopId, by }) => {
    const { stop, group } = await requireStop(ctx, stopId);
    const stops = await stopsOf(ctx, group._id);
    const other = stops[stops.findIndex((s) => s._id === stopId) + by];
    if (!other) return;
    await ctx.db.patch(group._id, { crawlCompleted: false });
    await ctx.db.patch(stop._id, { position: other.position });
    await ctx.db.patch(other._id, { position: stop.position });
  },
});

export const setCurrent = mutation({
  args: { groupId: v.id("groups"), stopId: v.union(v.id("crawlStops"), v.null()) },
  returns: v.null(),
  handler: async (ctx, { groupId, stopId }) => {
    await requireMembership(ctx, groupId);
    if (stopId) {
      const stop = await ctx.db.get(stopId);
      if (stop?.groupId !== groupId) throw new ConvexError("That stop is no longer on the crawl.");
    }
    await ctx.db.patch(groupId, { currentStopId: stopId ?? undefined, crawlCompleted: false });
  },
});

export const finish = mutation({
  args: { groupId: v.id("groups") },
  returns: v.null(),
  handler: async (ctx, { groupId }) => {
    const { group } = await requireMembership(ctx, groupId);
    const stops = await stopsOf(ctx, groupId);
    if (!stops.length || group.currentStopId !== stops.at(-1)?._id) {
      throw new ConvexError("Arrive at the final stop before finishing the crawl.");
    }
    await ctx.db.patch(groupId, { crawlCompleted: true });
    return null;
  },
});
