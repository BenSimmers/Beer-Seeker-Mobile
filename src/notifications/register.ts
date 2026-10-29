import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const getPushToken = async (): Promise<string | null> => {
  if (Platform.OS === "web" || !Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Requests and crawls",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status !== "granted" && canAskAgain) {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== "granted") return null;

  const projectId: unknown = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== "string") throw new Error("No EAS project id in app config");
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};
