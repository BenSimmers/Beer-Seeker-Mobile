import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import { notificationsLogger as log } from "../logger";
import { navigationRef } from "../navigation/ref";

export const useSignOut = () => {
  const { signOut } = useAuthActions();
  const unregisterDevice = useMutation(api.notifications.unregisterDevice);

  return useCallback(async () => {
    if (navigationRef.isReady())
      navigationRef.resetRoot({ index: 0, routes: [{ name: "Friends" }] });
    await unregisterDevice().catch((e) => log.debug("unregister skipped", e));
    await signOut();
  }, [signOut, unregisterDevice]);
};
