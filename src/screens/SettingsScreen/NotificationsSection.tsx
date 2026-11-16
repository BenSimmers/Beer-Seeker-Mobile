import { useConvexAuth, useMutation, useQuery } from "convex/react";
import React from "react";
import { api } from "../../../convex/_generated/api";
import { backendConfigured } from "../../backend";
import { useTheme } from "../../theme";
import { IconGlyph } from "./glyphs";
import { SettingRow } from "./SettingRow";
import { SettingsPanel } from "./SettingsPanel";

const SignedInNotifications: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const nudge = useQuery(api.nudges.mine, isAuthenticated ? {} : "skip");
  const setEnabled = useMutation(api.nudges.setEnabled).withOptimisticUpdate((store, args) => {
    store.setQuery(api.nudges.mine, {}, { enabled: args.enabled });
  });
  // Null until a device with notifications on has registered
  if (!nudge) return null;

  return (
    <SettingsPanel title="Notifications" summary={nudge.enabled ? "On" : "Off"}>
      <SettingRow
        glyph={<IconGlyph icon="beer-outline" color={colors.primary} />}
        title="Weekend nudge"
        description="A heads-up at 6pm on Fridays and Saturdays to see where friends are."
        trailing="check"
        selected={nudge.enabled}
        onPress={() => void setEnabled({ enabled: !nudge.enabled })}
        accessibilityRole="switch"
        accessibilityState={{ checked: nudge.enabled }}
        accessibilityLabel="Weekend nudge"
      />
    </SettingsPanel>
  );
};

export const NotificationsSection: React.FC = () =>
  backendConfigured ? <SignedInNotifications /> : null;
