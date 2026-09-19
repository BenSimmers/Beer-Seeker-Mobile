import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { LiquorStore, UserLocation } from "../types";
import { fonts, makeStyles, useTheme } from "../theme";
import { formatDistance, formatWalkTime, calculateBearing, bearingToCardinal } from "../utils/geo";
import React from "react";

type Props = {
  store: LiquorStore;
  dimmed?: boolean;
  userLocation?: UserLocation | null;
};

// Native scheme first, web URL second. Platform.OS is not narrowed to a lookup
// key, so unknown platforms fall through to the web URL instead of throwing.
const mapsUrls = (store: LiquorStore): string[] => {
  const coords = `${store.lat},${store.lng}`;
  // Parentheses break the geo: label delimiters and survive encodeURIComponent
  const label = encodeURIComponent(store.name.replace(/[()]/g, ""));
  const web = `https://www.google.com/maps/search/?api=1&query=${coords}`;

  if (Platform.OS === "ios") return [`maps:0,0?q=${label}@${coords}`, web];
  if (Platform.OS === "android") return [`geo:${coords}?q=${coords}(${label})`, web];
  return [web];
};

export const openInMaps = async (store: LiquorStore): Promise<void> => {
  for (const url of mapsUrls(store)) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // no handler for this scheme — try the next candidate
    }
  }
  Alert.alert("No maps app found", "Install Google Maps to get directions.");
};

export const callStore = (phoneNumber: string): void => {
  Linking.openURL(`tel:${phoneNumber}`).catch(() => {
    Alert.alert("Unable to call", "Your device does not support calling.");
  });
};

export const StoreCard: React.FC<Props> = ({ store, dimmed = false, userLocation }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const bearing = userLocation
    ? calculateBearing(userLocation.lat, userLocation.lng, store.lat, store.lng)
    : null;

  return (
    <View style={[styles.card, dimmed && styles.cardDimmed]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>
            {store.name}
          </Text>
          {store.openNow != null && (
            <View style={[styles.badge, store.openNow ? styles.badgeOpen : styles.badgeClosed]}>
              <Text
                style={[
                  styles.badgeText,
                  store.openNow ? styles.badgeTextOpen : styles.badgeTextClosed,
                ]}
              >
                {store.openNow ? "Open" : "Closed"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.address} numberOfLines={2}>
        {store.vicinity}
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.distanceCol}>
          <Text style={styles.distance}>{formatDistance(store.distance)}</Text>
          <Text style={styles.walkTime}>away • {formatWalkTime(store.distance)}</Text>
        </View>
        {bearing != null && (
          <View style={styles.bearingCol}>
            <Text style={styles.bearingLabel}>Bearing:</Text>
            <Text style={styles.bearing}>{bearingToCardinal(bearing)}</Text>
          </View>
        )}
      </View>

      <Pressable style={styles.mapsBtn} onPress={() => openInMaps(store)}>
        <Ionicons name="navigate-outline" size={16} color={colors.background} />
        <Text style={styles.mapsBtnText}>OPEN IN MAPS</Text>
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    gap: 12,
  },
  cardDimmed: {
    opacity: 0.45,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontFamily: fonts.headlineSemi,
    color: colors.headline,
    letterSpacing: -0.2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgeOpen: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  badgeClosed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  badgeText: {
    fontFamily: fonts.labelBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  badgeTextOpen: {
    color: colors.primary,
  },
  badgeTextClosed: {
    color: colors.muted,
  },
  phoneBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  address: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  distanceCol: {
    gap: 2,
  },
  distance: {
    color: colors.primary,
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  walkTime: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  bearingCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  bearingLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bearing: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 13,
  },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
  },
  mapsBtnText: {
    color: colors.background,
    fontFamily: fonts.labelBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
}));
