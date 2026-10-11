import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { fonts, makeStyles, useTheme } from "../theme";
import { followLabel, useFollowToggle, type Relation } from "./useFollowToggle";

export const FollowButton: React.FC<{ person: Relation }> = ({ person }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { toggle, busy, active } = useFollowToggle(person);
  const label = person.youFollow
    ? `Unfollow ${person.displayName}`
    : person.requested
      ? `Cancel your request to follow ${person.displayName}`
      : `Ask to follow ${person.displayName}`;

  return (
    <Pressable
      style={[styles.action, active && styles.actionActive]}
      onPress={() => void toggle()}
      disabled={busy}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={[styles.actionText, active && styles.actionTextActive]}>
          {followLabel(person)}
        </Text>
      )}
    </Pressable>
  );
};

const useStyles = makeStyles((colors) => ({
  action: {
    minWidth: 96,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  actionActive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: {
    color: colors.background,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  actionTextActive: {
    color: colors.primary,
  },
}));
