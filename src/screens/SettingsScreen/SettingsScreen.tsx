import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eyebrow, SectionLabel } from "../../components/ui";
import type { SettingsStackParamList } from "../../navigation/types";
import { usePreferences, type CompassStyle } from "../../preferences";
import { THEME_LABELS, THEME_NAMES, useTheme, type ThemeName } from "../../theme";
import { ClassicGlyph, IconGlyph, ModernGlyph, ThemeGlyph } from "./glyphs";
import { OptionGroup, type Option } from "./OptionGroup";
import { SettingRow } from "./SettingRow";
import { TravelModeSection } from "./TravelModeSection";
import { useStyles } from "./styles";

const THEME_OPTIONS: Option<ThemeName>[] = THEME_NAMES.map((name) => ({
  value: name,
  ...THEME_LABELS[name],
  glyph: <ThemeGlyph name={name} />,
}));

const COMPASS_OPTIONS: Option<CompassStyle>[] = [
  {
    value: "modern",
    title: "Modern",
    description: "Minimal dark dial with a fine needle.",
    glyph: <ModernGlyph />,
  },
  {
    value: "classic",
    title: "Classic",
    description: "Engraved brass-and-parchment chart rose.",
    glyph: <ClassicGlyph />,
  },
];

export const SettingsScreen: React.FC = () => {
  const { compassStyle, setCompassStyle } = usePreferences();
  const { theme, setTheme, colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Eyebrow style={styles.header}>Settings</Eyebrow>

        <View style={styles.sections}>
          <OptionGroup
            label="Theme"
            noun="theme"
            options={THEME_OPTIONS}
            value={theme}
            onChange={setTheme}
          />

          <OptionGroup
            label="Compass Face"
            noun="compass"
            options={COMPASS_OPTIONS}
            value={compassStyle}
            onChange={setCompassStyle}
          />

          <TravelModeSection />

          <View>
            <SectionLabel>App</SectionLabel>
            <SettingRow
              glyph={<IconGlyph icon="information-outline" color={colors.primary} />}
              title="About"
              description="What Beer Seeker does, and what it doesn't."
              trailing="chevron"
              onPress={() => navigation.navigate("About")}
              accessibilityRole="button"
              accessibilityLabel="About this app"
            />
          </View>
        </View>

        <Text style={styles.footnote}>Saved on this device.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};
