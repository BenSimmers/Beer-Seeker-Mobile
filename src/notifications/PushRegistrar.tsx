import { useConvexAuth, useMutation, useQuery } from "convex/react";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { notificationsLogger as log } from "../logger";
import { getPushToken } from "./register";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const PushRegistrar: React.FC = () => {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");
  const registerDevice = useMutation(api.notifications.registerDevice);
  const userId = profile?.userId;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getPushToken()
      .then((pushToken) => {
        if (pushToken && !cancelled) return registerDevice({ pushToken });
      })
      .catch((e) => log.warn("push registration failed", e));
    return () => {
      cancelled = true;
    };
  }, [userId, registerDevice]);

  return null;
};
