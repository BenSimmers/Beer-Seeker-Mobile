import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currentUserId, profileFor, requireUserId } from "./lib/session";
import {
  displayNameError,
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
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    if (!userId) return null;
    return profileFor(ctx, userId);
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
