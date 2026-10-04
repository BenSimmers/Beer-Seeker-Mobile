import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Id } from "../../convex/_generated/dataModel";
import type { ConnectionKind } from "../../convex/social";
import type { FavouritePlace } from "../favourites/places";
import type { FriendRef } from "../sharing";

export type SettingsStackParamList = {
  SettingsHome: undefined;
  About: undefined;
};

export type CompassStackParamList = {
  CompassHome: { target?: FavouritePlace; friend?: FriendRef } | undefined;
  Favourites: undefined;
};

export type FriendsStackParamList = {
  FriendsHome: undefined;
  Profile: { userId: Id<"users"> };
  Connections: { userId: Id<"users">; kind: ConnectionKind; name: string };
  EditProfile: undefined;
};

export type TabParamList = {
  Compass: NavigatorScreenParams<CompassStackParamList>;
  Friends: NavigatorScreenParams<FriendsStackParamList>;
};
