import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import type { Id } from "../../../convex/_generated/dataModel";
import { fonts, makeStyles, useTheme } from "../../theme";
import { followLabel, useFollowToggle } from "./useFollowToggle";

type Props = {
  userId: Id<"users">;
  displayName: string;
  youFollow: boolean;
  followsYou: boolean;
};

export const FollowButton: React.FC<Props> = ({ userId, displayName, youFollow, followsYou }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { toggle, busy } = useFollowToggle(userId, youFollow);

  return (
    <Pressable
      style={[styles.action, youFollow && styles.actionActive]}
      onPress={toggle}
      disabled={busy}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={youFollow ? `Unfollow ${displayName}` : `Follow ${displayName}`}
      accessibilityState={{ busy }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={[styles.actionText, youFollow && styles.actionTextActive]}>
          {followLabel({ youFollow, followsYou })}
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
