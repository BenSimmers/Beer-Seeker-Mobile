import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rosePoint } from "../components/compassShared";
import type { SettingsStackParamList } from "../navigation/types";
import {
  THEME_LABELS,
  THEME_NAMES,
  THEMES,
  classic,
  fonts,
  makeStyles,
  makeThemed,
  useTheme,
  type ThemeName,
} from "../theme";
import { usePreferences } from "../preferences";
import type { CompassStyle } from "../preferences";

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

const ClassicGlyph: React.FC = () => {
  const styles = useStyles();

  return (
    <View style={styles.classicGlyph}>
      {GLYPH_POINTS.map((point, i) => (
        <View key={i} style={point.wrap}>
          <View style={point.shadow} />
          <View style={point.lit} />
        </View>
      ))}
      <View style={styles.classicGlyphHub} />
    </View>
  );
};

const ModernGlyph: React.FC = () => {
  const styles = useStyles();
  const modernTicks = useModernTicks();

  return (
    <View style={styles.modernGlyph}>
      {modernTicks.map((tickStyle, i) => (
        <View key={i} style={[styles.modernGlyphTick, tickStyle]} />
      ))}
      <View style={styles.modernGlyphNeedle} />
      <View style={styles.modernGlyphHub} />
    </View>
  );
};

/** Three-swatch preview of a palette: background, surface and accent. */
const ThemeGlyph: React.FC<{ name: ThemeName }> = ({ name }) => {
  const styles = useStyles();
  const palette = THEMES[name];

  return (
    <View style={[styles.themeGlyph, { borderColor: palette.border }]}>
      <View style={[styles.themeGlyphHalf, { backgroundColor: palette.background }]} />
      <View style={[styles.themeGlyphHalf, { backgroundColor: palette.surface }]} />
      <View style={[styles.themeGlyphDot, { backgroundColor: palette.primary }]} />
    </View>
  );
};

type OptionProps = {
  title: string;
  description: string;
  accessibilityLabel: string;
  glyph: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
};

const OptionRow: React.FC<OptionProps> = ({
  title,
  description,
  accessibilityLabel,
  glyph,
  selected,
  onSelect,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
    >
      {glyph}

      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>

      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected && <Ionicons name="checkmark" size={14} color={colors.background} />}
      </View>
    </Pressable>
  );
};

const COMPASS_OPTIONS: { value: CompassStyle; title: string; description: string }[] = [
  { value: "modern", title: "Modern", description: "Minimal dark dial with a fine needle." },
  { value: "classic", title: "Classic", description: "Engraved brass-and-parchment chart rose." },
];

export const SettingsScreen: React.FC = () => {
  const { compassStyle, setCompassStyle } = usePreferences();
  const { theme, setTheme, colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <Text style={styles.sectionLabel}>Theme</Text>

        <View style={styles.optionGroup} accessibilityRole="radiogroup">
          {THEME_NAMES.map((name) => (
            <OptionRow
              key={name}
              title={THEME_LABELS[name].title}
              description={THEME_LABELS[name].description}
              accessibilityLabel={`${THEME_LABELS[name].title} theme`}
              glyph={<ThemeGlyph name={name} />}
              selected={theme === name}
              onSelect={() => setTheme(name)}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Compass Face</Text>

        <View style={styles.optionGroup} accessibilityRole="radiogroup">
          {COMPASS_OPTIONS.map((option) => (
            <OptionRow
              key={option.value}
              title={option.title}
              description={option.description}
              accessibilityLabel={`${option.title} compass`}
              glyph={option.value === "classic" ? <ClassicGlyph /> : <ModernGlyph />}
              selected={compassStyle === option.value}
              onSelect={() => setCompassStyle(option.value)}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>App</Text>

        <Pressable
          style={styles.option}
          onPress={() => navigation.navigate("About")}
          accessibilityRole="button"
          accessibilityLabel="About this app"
        >
          <View style={styles.aboutGlyph}>
            <Ionicons name="information-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>About</Text>
            <Text style={styles.optionDescription}>
              What Beer Seeker does, and what it doesn&apos;t.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </Pressable>

        <Text style={styles.footnote}>Saved on this device.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: 28,
  },
  optionGroup: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 16,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionDescription: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 2,
  },
  footnote: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 14,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modernGlyph: {
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH_R,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  modernGlyphTick: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -0.5,
    transformOrigin: "top",
  },
  modernGlyphNeedle: {
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
  modernGlyphHub: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  classicGlyph: {
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
  classicGlyphHub: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: classic.gold,
  },
  aboutGlyph: {
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH_R,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  themeGlyph: {
    width: GLYPH,
    height: GLYPH,
    borderRadius: GLYPH_R,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  themeGlyphHalf: {
    width: GLYPH_R,
    height: GLYPH,
  },
  themeGlyphDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
  },
}));
