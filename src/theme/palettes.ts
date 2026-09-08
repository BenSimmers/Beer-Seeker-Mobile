import { Platform } from "react-native";

export type ThemeName = "midnight" | "vintage";

export const THEME_NAMES: ThemeName[] = ["midnight", "vintage"];

export const DEFAULT_THEME: ThemeName = "midnight";

export type Palette = {
  primary: string;
  primaryMuted: string;
  secondary: string;
  tertiary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  headline: string;
  body: string;
  muted: string;
  danger: string;
  dangerBorder: string;
  dangerBg: string;
  /** Water fill for the Android map style; everything else reuses the surface tokens. */
  mapWater: string;
  /** Non-cardinal ticks on the compass dial — a wash over the face, not a solid. */
  dialTick: string;
};

// Charcoal and amber — the current look.
const midnight: Palette = {
  primary: "#FFBF00",
  primaryMuted: "#FFBF0022",
  secondary: "#D4AF37",
  tertiary: "#704214",
  background: "#0F0F0F",
  surface: "#1A1A1A",
  surfaceAlt: "#242424",
  border: "#D4AF3733",
  headline: "#F5F3EC",
  body: "#B9B4A6",
  muted: "#7A756A",
  danger: "#e0704a",
  dangerBorder: "#e0704a44",
  dangerBg: "#2a1410",
  mapWater: "#0a1420",
  dialTick: "rgba(255,255,255,0.18)",
};

// Brown and brass — the palette the app shipped with before the charcoal
// refresh, restored token-for-token from the pre-`update theme` colours.
const vintage: Palette = {
  primary: "#c8960c",
  primaryMuted: "#c8960c22",
  secondary: "#c8a96e",
  tertiary: "#6b4c00",
  background: "#100a02",
  surface: "#1c1005",
  surfaceAlt: "#2a1c08",
  border: "#c8960c33",
  headline: "#f0dca4",
  body: "#c8b088",
  muted: "#a08050",
  danger: "#e07040",
  dangerBorder: "#6b2000",
  dangerBg: "#2a1000",
  mapWater: "#101820",
  dialTick: "rgba(200,169,110,0.35)",
};

export const THEMES: Record<ThemeName, Palette> = { midnight, vintage };

export const THEME_LABELS: Record<ThemeName, { title: string; description: string }> = {
  midnight: { title: "Midnight", description: "Charcoal black with a bright amber accent." },
  vintage: { title: "Vintage", description: "Warm brown and brass — the original look." },
};

export const isThemeName = (value: unknown): value is ThemeName =>
  value === "midnight" || value === "vintage";

// Compass rose face for the "classic" compass style. Brass-on-parchment reads
// the same against either background, so it is not themed.
export const classic = {
  bezel: "#7A5C28",
  bezelEdge: "#C9A227",
  bezelInner: "#5C441C",
  card: "#E7D9B6",
  cardEdge: "#CDBB90",
  ink: "#3B2B16",
  inkSoft: "rgba(59,43,22,0.35)",
  inkFaint: "rgba(59,43,22,0.18)",
  gold: "#A8791C",
  goldLight: "#E3BE55",
  needle: "#8E2B1E",
} as const;

export const fonts = {
  headline: "HankenGrotesk_700Bold",
  headlineSemi: "HankenGrotesk_600SemiBold",
  body: "HankenGrotesk_400Regular",
  bodyMedium: "HankenGrotesk_500Medium",
  label: "SpaceGrotesk_500Medium",
  labelBold: "SpaceGrotesk_700Bold",
  serif: Platform.select({ ios: "Times New Roman", default: "serif" }),
} as const;
