import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Id } from "../../convex/_generated/dataModel";
import type { ConnectionKind } from "../../convex/social";
import type { FavouritePlace } from "../favourites/places";
import type { FriendRef } from "../sharing";

export type ProfileStackParamList = {
  Profile: { userId: Id<"users"> };
  Connections: { userId: Id<"users">; kind: ConnectionKind; name: string };
  EditProfile: undefined;
  Blocked: undefined;
};

export type SettingsStackParamList = ProfileStackParamList & {
  SettingsHome: undefined;
  About: undefined;
};

export type CompassStackParamList = ProfileStackParamList & {
  CompassHome: { target?: FavouritePlace; friend?: FriendRef } | undefined;
  Favourites: undefined;
};

export type BrowseStackParamList = ProfileStackParamList & {
  BrowseHome: undefined;
};

export type FriendsStackParamList = ProfileStackParamList & {
  FriendsHome: undefined;
  Group: { groupId: Id<"groups"> };
  PickGroupMembers: { groupId?: Id<"groups"> } | undefined;
  AddCrawlStop: { groupId: Id<"groups"> };
};

export type TabParamList = {
  Compass: NavigatorScreenParams<CompassStackParamList>;
  Friends: NavigatorScreenParams<FriendsStackParamList>;
};
