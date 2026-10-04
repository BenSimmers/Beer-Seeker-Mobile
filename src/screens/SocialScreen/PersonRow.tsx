import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Person } from "../../../convex/social";
import { Card } from "../../components/ui";
import { fonts, makeStyles, useTheme } from "../../theme";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";

type Props = {
  person: Person;
  onPress: () => void;
  children?: React.ReactNode;
};

export const PersonRow: React.FC<Props> = ({ person, onPress, children }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Pressable
          style={styles.who}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${person.displayName}, @${person.username}`}
          accessibilityHint="Opens their profile"
        >
          <Avatar name={person.displayName} uri={person.avatarUrl} />
          <View style={styles.text}>
            <Text style={styles.name} numberOfLines={1}>
              {person.displayName}
              {person.isYou ? " (you)" : ""}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              @{person.username}
              {person.followsYou && !person.youFollow ? " · Follows you" : ""}
            </Text>
          </View>
          {person.isYou && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
        </Pressable>

        {!person.isYou && (
          <FollowButton
            userId={person.userId}
            displayName={person.displayName}
            youFollow={person.youFollow}
            followsYou={person.followsYou}
          />
        )}
      </View>
      {children}
    </Card>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  who: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
}));
