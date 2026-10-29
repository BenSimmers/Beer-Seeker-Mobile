import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { pushNotifications } from "./lib/push";
import { requireUserId } from "./lib/session";

// e.g. "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
const EXPO_TOKEN = /^Expo(nent)?PushToken\[[^\]]{1,200}\]$/;

/** Points the caller's notifications at this device. */
export const registerDevice = mutation({
  args: { pushToken: v.string() },
  returns: v.null(),
  handler: async (ctx, { pushToken }) => {
    const me = await requireUserId(ctx);
    if (!EXPO_TOKEN.test(pushToken)) throw new ConvexError("That isn't a push token.");
    await pushNotifications.recordToken(ctx, { userId: me, pushToken });
    return null;
  },
});

/** Stops notifications to the caller, e.g. before signing out. */
export const unregisterDevice = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const me = await requireUserId(ctx);
    await pushNotifications.removeToken(ctx, { userId: me });
    return null;
  },
});
