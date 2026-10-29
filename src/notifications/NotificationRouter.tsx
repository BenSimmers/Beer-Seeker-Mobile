import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { navigationRef } from "../navigation/ref";
import { parseTarget } from "./target";

export const NotificationRouter: React.FC<{ ready: boolean }> = ({ ready }) => {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!ready || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    Notifications.clearLastNotificationResponse();
    const target = parseTarget(response.notification.request.content.data);
    if (!target) return;
    if (target.screen === "Group") {
      navigationRef.navigate("Friends", {
        screen: "Group",
        params: { groupId: target.groupId },
        initial: false,
      });
    } else {
      navigationRef.navigate("Friends", { screen: "FriendsHome" });
    }
  }, [ready, response]);

  return null;
};
