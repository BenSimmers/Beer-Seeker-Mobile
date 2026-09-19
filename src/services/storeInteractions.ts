import { Alert, Linking, Platform } from "react-native";
import type { LiquorStore } from "../types";

const mapsUrls = (store: LiquorStore): string[] => {
  const coords = `${store.lat},${store.lng}`;
  const label = encodeURIComponent(store.name.replace(/[()]/g, ""));
  const web = `https://www.google.com/maps/search/?api=1&query=${coords}`;

  if (Platform.OS === "ios") return [`maps:0,0?q=${label}@${coords}`, web];
  if (Platform.OS === "android") return [`geo:${coords}?q=${coords}(${label})`, web];
  return [web];
};

export const openInMaps = async (store: LiquorStore): Promise<void> => {
  for (const url of mapsUrls(store)) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // no handler for this scheme — try the next candidate
    }
  }
  Alert.alert("No maps app found", "Install Google Maps to get directions.");
};

export const callStore = (phoneNumber: string): void => {
  Linking.openURL(`tel:${phoneNumber}`).catch(() => {
    Alert.alert("Unable to call", "Your device does not support calling.");
  });
};
