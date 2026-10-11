import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { findBlock } from "./lib/blocks";
import { findRequest } from "./lib/requests";
import { listFavourites, type SharedFavourite } from "./lib/favourites";
import { CONNECTIONS_LIMIT } from "./lib/limits";
import {
  avatarUrlFor,
  currentUserId,
  edgesOf,
  findFollow,
  profileFor,
  requireUserId,
} from "./lib/session";
import {
  bioError,
  displayNameError,
  normalizeBio,
  normalizeDisplayName,
  normalizeUsername,
  usernameError,
} from "./lib/username";

/**
 * The signed-in user's profile. `undefined` on the client means loading,
 * `null` means signed out or signed up but not yet given a username.
 */
export const me = query({
  args: {},
  handler: async (ctx): Promise<(Doc<"profiles"> & { avatarUrl: string | null }) | null> => {
    const userId = await currentUserId(ctx);
    if (!userId) return null;
    const profile = await profileFor(ctx, userId);
    return profile && { ...profile, avatarUrl: await avatarUrlFor(ctx, profile) };
  },
});

export const create = mutation({
  args: { username: v.string(), displayName: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const username = normalizeUsername(args.username);
    const displayName = normalizeDisplayName(args.displayName);
    const invalid = usernameError(username) ?? displayNameError(displayName);
    if (invalid) throw new ConvexError(invalid);

    if (await profileFor(ctx, userId)) {
      throw new ConvexError("You already have a profile.");
    }

    // Convex has no unique constraints; mutations are serializable, so this
    // check-then-insert can't race with another claim on the same name.
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (taken) throw new ConvexError(`@${username} is taken.`);

    return ctx.db.insert("profiles", { userId, username, displayName });
  },
});

export const update = mutation({
  args: { displayName: v.string(), bio: v.string(), showFavourites: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const profile = await profileFor(ctx, userId);
    if (!profile) throw new ConvexError("Create your profile first.");

    const displayName = normalizeDisplayName(args.displayName);
    const bio = normalizeBio(args.bio);
    const invalid = displayNameError(displayName) ?? bioError(bio);
    if (invalid) throw new ConvexError(invalid);

    await ctx.db.patch(profile._id, { displayName, bio, showFavourites: args.showFavourites });
  },
});

export type ProfileView = {
  userId: Id<"users">;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  isYou: boolean;
  /** You blocked them: show only enough to recognise them and unblock. */
  youBlocked: boolean;
  youFollow: boolean;
  followsYou: boolean;
  /** You've asked to follow them. */
  requested: boolean;
  /** They've asked to follow you. */
  requestedYou: boolean;
  counts: { friends: number; following: number; followers: number };
  /** True when a count hit the read cap and should show as "N+". */
  countsCapped: boolean;
  /** Your own setting; only returned on your own profile. */
  showFavourites: boolean | null;
  /** Null when hidden from the caller: they aren't friends, or it's switched off. */
  favourites: SharedFavourite[] | null;
};

/**
 * Someone's profile as the caller is allowed to see it, or null if there's
 * none. Someone who blocked the caller gets null too, as if they'd gone.
 */
export const view = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<ProfileView | null> => {
    const callerId = await requireUserId(ctx);
    const profile = await profileFor(ctx, userId);
    if (!profile) return null;

    const isYou = userId === callerId;
    const [out, back, edges, youBlocked, theyBlocked, requested, requestedYou] = await Promise.all([
      isYou ? null : findFollow(ctx, callerId, userId),
      isYou ? null : findFollow(ctx, userId, callerId),
      edgesOf(ctx, userId),
      isYou ? null : findBlock(ctx, callerId, userId),
      isYou ? null : findBlock(ctx, userId, callerId),
      isYou ? null : findRequest(ctx, callerId, userId),
      isYou ? null : findRequest(ctx, userId, callerId),
    ]);
    if (theyBlocked) return null;
    const visible = profile.showFavourites !== false;
    const canSeeFavourites = isYou || (out !== null && back !== null && visible);

    return {
      userId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: await avatarUrlFor(ctx, profile),
      bio: profile.bio ?? "",
      isYou,
      youBlocked: youBlocked !== null,
      youFollow: out !== null,
      followsYou: back !== null,
      requested: requested !== null,
      requestedYou: requestedYou !== null,
      counts: {
        friends: edges.friends.size,
        following: edges.following.size,
        followers: edges.followers.size,
      },
      countsCapped:
        edges.following.size >= CONNECTIONS_LIMIT || edges.followers.size >= CONNECTIONS_LIMIT,
      showFavourites: isYou ? visible : null,
      favourites: canSeeFavourites ? await listFavourites(ctx, userId) : null,
    };
  },
});

// The app uploads a ~512px JPEG; this leaves room for PNGs without letting
// anyone park large files on the account.
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const requireProfile = async (ctx: MutationCtx) => {
  const userId = await requireUserId(ctx);
  const profile = await profileFor(ctx, userId);
  if (!profile) throw new ConvexError("Create your profile first.");
  return profile;
};

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/**
 * Returns an error message rather than throwing for a bad file: a throw would
 * roll back deleting it too.
 */
export const setAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }): Promise<string | null> => {
    const profile = await requireProfile(ctx);
    if (profile.avatarId === storageId) return null;

    // Upload URLs aren't tied to a user, so make sure nobody else is using it.
    const claimed = await ctx.db
      .query("profiles")
      .withIndex("by_avatar", (q) => q.eq("avatarId", storageId))
      .first();
    if (claimed) throw new ConvexError("That upload is already in use.");

    const file = await ctx.db.system.get("_storage", storageId);
    if (!file) throw new ConvexError("That upload didn't arrive. Try again.");
    if (!AVATAR_TYPES.has(file.contentType ?? "") || file.size > AVATAR_MAX_BYTES) {
      await ctx.storage.delete(storageId);
      return "Profile photos must be a JPEG, PNG or WebP under 2 MB.";
    }
    if (profile.avatarId) await ctx.storage.delete(profile.avatarId);
    await ctx.db.patch(profile._id, { avatarId: storageId });
    return null;
  },
});

export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    if (!profile.avatarId) return;
    await ctx.storage.delete(profile.avatarId);
    await ctx.db.patch(profile._id, { avatarId: undefined });
  },
});
