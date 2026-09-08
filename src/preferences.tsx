import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME, isThemeName } from "./theme/palettes";
import type { ThemeName } from "./theme/palettes";
import { settingsLogger as log } from "./logger";

export type CompassStyle = "modern" | "classic";

const isCompassStyle = (value: unknown): value is CompassStyle =>
  value === "modern" || value === "classic";

type Preferences = {
  compassStyle: CompassStyle;
  theme: ThemeName;
};

const KEYS: Record<keyof Preferences, string> = {
  compassStyle: "compass_style_v1",
  theme: "theme_v1",
};

const DEFAULTS: Preferences = {
  compassStyle: "modern",
  theme: DEFAULT_THEME,
};

type PreferencesValue = Preferences & {
  setCompassStyle: (style: CompassStyle) => void;
  setTheme: (theme: ThemeName) => void;
  /** False until the stored values have been read; the app holds a blank frame until then. */
  hydrated: boolean;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

type PreferencesProviderProps = { children: React.ReactNode };

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.multiGet([KEYS.compassStyle, KEYS.theme])
      .then((entries) => {
        if (cancelled) return;
        const stored = new Map(entries);
        const compassStyle = stored.get(KEYS.compassStyle);
        const theme = stored.get(KEYS.theme);
        setPrefs({
          compassStyle: isCompassStyle(compassStyle) ? compassStyle : DEFAULTS.compassStyle,
          theme: isThemeName(theme) ? theme : DEFAULTS.theme,
        });
      })
      .catch((e) => log.warn("failed to read preferences", e))
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((current) => ({ ...current, [key]: value }));
    AsyncStorage.setItem(KEYS[key], value).catch((e) => log.warn(`failed to persist ${key}`, e));
  }, []);

  const value = useMemo(
    () => ({
      ...prefs,
      setCompassStyle: (style: CompassStyle) => set("compassStyle", style),
      setTheme: (theme: ThemeName) => set("theme", theme),
      hydrated,
    }),
    [prefs, set, hydrated],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = (): PreferencesValue => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside a PreferencesProvider");
  return ctx;
};
