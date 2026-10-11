import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import type { ProfileStackParamList } from "./types";

/**
 * Pushes a profile onto the current tab's stack. Push rather than navigate, so going
 * profile → friends → profile builds a trail you can walk back along.
 */
export const useOpenProfile = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  return useCallback((userId: Id<"users">) => navigation.push("Profile", { userId }), [navigation]);
};
