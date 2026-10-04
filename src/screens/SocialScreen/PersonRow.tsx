import { useMutation } from "convex/react";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Person } from "../../../convex/social";
import { errorMessage } from "../../backend";
import { Card } from "../../components/ui";
import { useToast } from "../../components/Toast";
import { fonts, makeStyles, useTheme } from "../../theme";

const actionLabel = ({ youFollow, followsYou }: Person): string => {
  if (youFollow && followsYou) return "Friends";
  if (youFollow) return "Following";
  return followsYou ? "Follow back" : "Follow";
};

export const PersonRow: React.FC<{ person: Person }> = ({ person }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const follow = useMutation(api.social.follow);
  const unfollow = useMutation(api.social.unfollow);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      await (person.youFollow ? unfollow : follow)({ userId: person.userId });
    } catch (err) {
      toast.show(errorMessage(err, "Couldn't update that. Check your connection."), "error");
    } finally {
      setBusy(false);
    }
  };

  const label = actionLabel(person);

  return (
    <Card style={styles.row}>
      <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.avatarText}>{person.displayName.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {person.displayName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          @{person.username}
          {person.followsYou && !person.youFollow ? " · Follows you" : ""}
        </Text>
      </View>

      <Pressable
        style={[styles.action, person.youFollow && styles.actionActive]}
        onPress={toggle}
        disabled={busy}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={
          person.youFollow ? `Unfollow ${person.displayName}` : `Follow ${person.displayName}`
        }
        accessibilityState={{ busy }}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.actionText, person.youFollow && styles.actionTextActive]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Card>
  );
};

const AVATAR = 40;

const useStyles = makeStyles((colors) => ({
  row: {
    marginBottom: 10,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.headline,
    fontSize: 17,
  },
  text: {
    flex: 1,
  },
  name: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 16,
  },
  meta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
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
