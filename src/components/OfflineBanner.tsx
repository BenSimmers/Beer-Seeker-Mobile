import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useOnline } from "../network";
import { fonts, makeStyles, useTheme } from "../theme";

export const OfflineBanner: React.FC = () => {
  const online = useOnline();
  const { colors } = useTheme();
  const styles = useStyles();

  if (online) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={14} color={colors.muted} />
      <Text style={styles.text}>Offline — showing saved places</Text>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  text: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 0.5,
  },
}));
