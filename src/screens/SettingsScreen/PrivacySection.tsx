import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useConvexAuth } from "convex/react";
import React from "react";
import { backendConfigured } from "../../backend";
import type { SettingsStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme";
import { IconGlyph } from "./glyphs";
import { SettingRow } from "./SettingRow";
import { SettingsPanel } from "./SettingsPanel";

const SignedInPrivacy: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { isAuthenticated } = useConvexAuth();
  if (!isAuthenticated) return null;

  return (
    <SettingsPanel title="Privacy">
      <SettingRow
        glyph={<IconGlyph icon="ban-outline" color={colors.primary} />}
        title="Blocked accounts"
        description="See who you've blocked, and unblock them."
        trailing="chevron"
        onPress={() => navigation.navigate("Blocked")}
        accessibilityRole="button"
      />
    </SettingsPanel>
  );
};

/** Account privacy controls. Renders nothing unless signed in. */
export const PrivacySection: React.FC = () =>
  // The Convex hooks need ConvexAuthProvider, which is absent without a URL.
  backendConfigured ? <SignedInPrivacy /> : null;
