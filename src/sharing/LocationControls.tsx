import { Ionicons } from "@expo/vector-icons";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../../convex/_generated/api";
import type { Person } from "../../convex/social";
import { useAction } from "../hooks/useAction";
import type { TabParamList } from "../navigation/types";
import { timeLeft } from "./freshness";
import { useNow } from "./useNow";
import { fonts, makeStyles, useTheme } from "../theme";
import { useOpenFriendInMaps } from "./useOpenFriendInMaps";

export const DURATIONS = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 4 * 60 },
  { label: "8 hours", minutes: 8 * 60 },
] as const;

// Enough to keep "52 min left" honest without re-rendering every second.
const CLOCK_TICK_MS = 30_000;

type Props = { person: Pick<Person, "userId" | "displayName"> };

/** Only render this for friends. */
export const LocationControls: React.FC<Props> = ({ person }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NavigationProp<TabParamList>>();
  const openInMaps = useOpenFriendInMaps();
  // One subscription however many rows ask: Convex dedupes identical queries.
  const shares = useQuery(api.location.shares);
  const now = useNow(CLOCK_TICK_MS);
  const sharingUntil = shares?.outgoing.find((s) => s.userId === person.userId)?.expiresAt ?? null;
  const sharesWithYou = shares?.incoming.some((s) => s.userId === person.userId) ?? false;
  const start = useMutation(api.location.startSharing);
  const stop = useMutation(api.location.stopSharing);
  const [choosing, setChoosing] = useState(false);
  const { run: runAction, busy } = useAction();

  const run = async (action: () => Promise<unknown>) => {
    if (await runAction(action, "Couldn't update sharing. Check your connection.")) {
      setChoosing(false);
    }
  };

  const find = () =>
    navigation.navigate("Compass", {
      screen: "CompassHome",
      params: { friend: { userId: person.userId, name: person.displayName } },
    });

  if (choosing) {
    return (
      <View style={styles.chooser}>
        <Text style={styles.consent}>
          {person.displayName} will see where you are while this app is open on your phone, until
          the time runs out. You can stop sharing at any time.
        </Text>
        <View style={styles.row}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d.minutes}
              style={styles.chip}
              disabled={busy}
              onPress={() => run(() => start({ friendId: person.userId, minutes: d.minutes }))}
              accessibilityRole="button"
              accessibilityLabel={`Share your location with ${person.displayName} for ${d.label}`}
            >
              <Text style={styles.chipText}>{d.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.link}
            onPress={() => setChoosing(false)}
            hitSlop={6}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {sharingUntil !== null ? (
        <View style={styles.status}>
          <Ionicons name="radio" size={14} color={colors.primary} />
          <Text style={styles.statusText} numberOfLines={1}>
            Sharing · {timeLeft(sharingUntil, now)}
          </Text>
          <Pressable
            style={styles.link}
            disabled={busy}
            onPress={() => run(() => stop({ friendId: person.userId }))}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Stop sharing your location with ${person.displayName}`}
          >
            <Text style={styles.linkText}>Stop</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.chip}
          onPress={() => setChoosing(true)}
          accessibilityRole="button"
          accessibilityLabel={`Share your location with ${person.displayName}`}
        >
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={styles.chipText}>Share location</Text>
        </Pressable>
      )}

      {sharesWithYou && (
        <>
          <Pressable
            style={[styles.chip, styles.chipFilled]}
            onPress={find}
            accessibilityRole="button"
            accessibilityLabel={`Point the compass at ${person.displayName}`}
          >
            <Ionicons name="compass" size={14} color={colors.background} />
            <Text style={[styles.chipText, styles.chipTextFilled]}>Find</Text>
          </Pressable>
          <Pressable
            style={styles.chip}
            onPress={() => void openInMaps(person)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${person.displayName}'s location in Maps`}
          >
            <Ionicons name="map-outline" size={14} color={colors.primary} />
            <Text style={styles.chipText}>Maps</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  chooser: {
    gap: 10,
  },
  consent: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipFilled: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  chipTextFilled: {
    color: colors.background,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  statusText: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 12,
    flexShrink: 1,
  },
  link: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  linkText: {
    color: colors.muted,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
}));
