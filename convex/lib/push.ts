import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export const pushNotifications = new PushNotifications<Id<"users">>(components.pushNotifications);

export type PushTarget = { screen: "FriendsHome" } | { screen: "Group"; groupId: Id<"groups"> };

export type Push = {
  title: string;
  body: string;
  target: PushTarget;
  collapseKey?: string;
};

export const notify = async (ctx: MutationCtx, userIds: Id<"users">[], push: Push) => {
  if (!userIds.length) return;
  await pushNotifications.sendPushNotificationBatch(ctx, {
    allowUnregisteredTokens: true,
    notifications: userIds.map((userId) => ({
      userId,
      notification: {
        title: push.title,
        body: push.body,
        data: push.target,
        sound: "default",
        priority: "high",
        collapseId: push.collapseKey,
        tag: push.collapseKey,
      },
    })),
  });
};
