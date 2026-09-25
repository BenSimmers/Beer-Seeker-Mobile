import type { FavouritePlace } from "../favourites/places";

export type SettingsStackParamList = {
  SettingsHome: undefined;
  About: undefined;
};

export type CompassStackParamList = {
  CompassHome: { target?: FavouritePlace } | undefined;
  Favourites: undefined;
};
