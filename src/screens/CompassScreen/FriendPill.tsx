import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { FriendTracking } from "../../sharing";
import { fonts, makeStyles, useTheme } from "../../theme";

type Props = {
  name: string;
  tracking: FriendTracking;
  onClear: () => void;
};

const detail = (name: string, tracking: FriendTracking): string | null => {
  switch (tracking.status) {
    case "loading":
      return null;
    case "ended":
      return `${name} isn't sharing their location with you right now.`;
    case "waiting":
      return `Waiting for ${name}'s phone to send a location…`;
    case "live":
      if (tracking.fix.warning === "stale") {
        return `${tracking.fix.label}. They may have closed the app, so the arrow shows where they were.`;
      }
      if (tracking.fix.warning === "imprecise") {
        return `Their location is approximate (${tracking.fix.accuracyLabel}), so the arrow is a rough direction.`;
      }
      return tracking.fix.label;
  }
};

export const FriendPill: React.FC<Props> = ({ name, tracking, onClear }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const warn =
    tracking.status === "ended" || (tracking.status === "live" && tracking.fix.warning !== null);
  const text = detail(name, tracking);

  return (
    <View style={styles.wrap}>
      <View style={[styles.pill, warn && styles.pillWarn]}>
        <Ionicons name="person" size={13} color={warn ? colors.muted : colors.primary} />
        <Text style={[styles.text, warn && styles.textWarn]} numberOfLines={1}>
          Pointing at {name}
        </Text>
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Stop pointing at ${name}`}
        >
          <Ionicons name="close" size={15} color={colors.muted} />
        </Pressable>
      </View>
      {text && (
        <Text style={styles.detail} accessibilityLiveRegion="polite">
          {text}
        </Text>
      )}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  wrap: {
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillWarn: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  text: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  textWarn: {
    color: colors.body,
  },
  detail: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 12,
  },
}));
