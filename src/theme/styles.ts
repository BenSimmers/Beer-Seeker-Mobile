import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { usePreferences } from "../preferences";
import { THEMES } from "./palettes";
import type { Palette, ThemeName } from "./palettes";

type ThemeValue = {
  theme: ThemeName;
  colors: Palette;
  setTheme: (theme: ThemeName) => void;
};

/** The active palette. Preferences own the stored name; this resolves it. */
export const useTheme = (): ThemeValue => {
  const { theme, setTheme } = usePreferences();
  return { theme, colors: THEMES[theme], setTheme };
};

/**
 * Builds a hook that derives a value from the active palette. The factory runs
 * once per theme and the result is cached, so themed constants cost no more
 * than the module-level ones they replace.
 */
export const makeThemed = <T>(factory: (colors: Palette) => T) => {
  const cache = new Map<ThemeName, T>();
  const useThemed = (): T => {
    const { theme, colors } = useTheme();
    let cached = cache.get(theme);
    if (cached === undefined) {
      cached = factory(colors);
      cache.set(theme, cached);
    }
    return cached;
  };
  return useThemed;
};

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Themed replacement for a module-level `StyleSheet.create`. Declare the sheet
 * as a factory over the palette and call the returned hook inside the component.
 */
export const makeStyles = <T extends NamedStyles<T>>(factory: (colors: Palette) => T) =>
  makeThemed((colors) => StyleSheet.create(factory(colors)));
