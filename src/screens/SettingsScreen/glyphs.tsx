import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { rosePoint } from "../../components/compassShared";
import { THEMES, classic, makeStyles, makeThemed, type ThemeName } from "../../theme";

const GLYPH = 52;
const GLYPH_R = GLYPH / 2;

const GLYPH_POINTS = Array.from({ length: 8 }, (_, i) => i * 45).map((deg) => {
  const isMajor = deg % 90 === 0;
  return rosePoint({
    deg,
    len: GLYPH_R * (isMajor ? 0.74 : 0.42),
    halfWidth: GLYPH_R * (isMajor ? 0.1 : 0.07),
    shadowColor: deg === 0 ? classic.gold : classic.ink,
    litColor: deg === 0 ? classic.goldLight : "#F7F0DC",
  });
});

const useModernTicks = makeThemed((colors) =>
  Array.from({ length: 12 }, (_, i) => {
    const deg = i * 30;
    const isCardinal = deg % 90 === 0;
    return {
      transform: [{ rotate: `${deg}deg` }, { translateY: -(GLYPH_R - 4) }],
      height: isCardinal ? 6 : 3,
      width: isCardinal ? 1.5 : 1,
      backgroundColor: isCardinal ? colors.secondary : colors.dialTick,
    } as const;
  }),
);

export const ClassicGlyph: React.FC = () => {
  const styles = useStyles();

  return (
    <View style={styles.classic}>
      {GLYPH_POINTS.map((point, i) => (
        <View key={i} style={point.wrap}>
          <View style={point.shadow} />
          <View style={point.lit} />
        </View>
      ))}
      <View style={styles.classicHub} />
    </View>
  );
};

export const ModernGlyph: React.FC = () => {
  const styles = useStyles();
  const modernTicks = useModernTicks();

  return (
    <View style={styles.modern}>
      {modernTicks.map((tickStyle, i) => (
        <View key={i} style={[styles.modernTick, tickStyle]} />
      ))}
      <View style={styles.modernNeedle} />
      <View style={styles.modernHub} />
    </View>
  );
};

/** Three-swatch preview of a palette: background, surface and accent. */
export const ThemeGlyph: React.FC<{ name: ThemeName }> = ({ name }) => {
  const styles = useStyles();
  const palette = THEMES[name];

  return (
    <View style={[styles.theme, { borderColor: palette.border }]}>
      <View style={[styles.themeHalf, { backgroundColor: palette.background }]} />
      <View style={[styles.themeHalf, { backgroundColor: palette.surface }]} />
      <View style={[styles.themeDot, { backgroundColor: palette.primary }]} />
    </View>
  );
};

type IconGlyphProps = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  ringColor?: string;
};

export const IconGlyph: React.FC<IconGlyphProps> = ({ icon, color, ringColor }) => {
  const styles = useStyles();
  return (
    <View style={[styles.icon, ringColor != null && { borderColor: ringColor }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  modern: {
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH_R,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  modernTick: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -0.5,
    transformOrigin: "top",
  },
  modernNeedle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 2,
    height: GLYPH_R * 0.62,
    marginLeft: -1,
    marginTop: -GLYPH_R * 0.62,
    borderRadius: 1,
    backgroundColor: colors.primary,
    transformOrigin: "bottom",
    transform: [{ rotate: "38deg" }],
  },
  modernHub: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  classic: {
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH_R,
    borderWidth: 2,
    borderColor: classic.bezelEdge,
    backgroundColor: classic.card,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  classicHub: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: classic.gold,
  },
  icon: {
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH_R,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  theme: {
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH_R,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  themeHalf: {
    width: GLYPH_R,
    height: GLYPH,
  },
  themeDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
  },
}));
