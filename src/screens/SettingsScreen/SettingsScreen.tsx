import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileButton } from "../../components/ProfileButton";
import { Eyebrow } from "../../components/ui";
import type { SettingsStackParamList } from "../../navigation/types";
import { usePreferences, type CompassStyle } from "../../preferences";
import { THEME_LABELS, THEME_NAMES, useTheme, type ThemeName } from "../../theme";
import { ClassicGlyph, IconGlyph, ModernGlyph, ThemeGlyph } from "./glyphs";
import { OptionGroup, type Option } from "./OptionGroup";
import { PrivacySection } from "./PrivacySection";
import { SettingRow } from "./SettingRow";
import { SettingsPanel } from "./SettingsPanel";
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
  const compassFace = COMPASS_OPTIONS.find((o) => o.value === compassStyle)?.title;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Eyebrow>Settings</Eyebrow>
          <ProfileButton />
        </View>

        <View style={styles.sections}>
          <SettingsPanel title="Theme" summary={THEME_LABELS[theme].title}>
            <OptionGroup noun="theme" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
          </SettingsPanel>

          <SettingsPanel title="Compass Face" summary={compassFace}>
            <OptionGroup
              noun="compass"
              options={COMPASS_OPTIONS}
              value={compassStyle}
              onChange={setCompassStyle}
            />
          </SettingsPanel>

          <TravelModeSection />

          <PrivacySection />

          <SettingsPanel title="App">
            <SettingRow
              glyph={<IconGlyph icon="information-outline" color={colors.primary} />}
              title="About"
              description="What Beer Seeker does, and what it doesn't."
              trailing="chevron"
              onPress={() => navigation.navigate("About")}
              accessibilityRole="button"
              accessibilityLabel="About this app"
            />
          </SettingsPanel>
        </View>

        <Text style={styles.footnote}>Saved on this device.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};
