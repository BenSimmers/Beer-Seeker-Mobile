import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NearbyPlace, UserLocation } from "../../types";
import { CATEGORY_LABELS } from "../../types";
import { fonts, makeStyles, useTheme } from "../../theme";
import {
  bearingToCardinal,
  calculateBearing,
  formatDistance,
  formatWalkTime,
} from "../../utils/geo";
import { callStore, openInMaps } from "../../services/storeInteractions";

type Props = {
  place: NearbyPlace;
  userLocation: UserLocation | null;
  onPress: () => void;
  /** Saved places sort to the top of the list, so the card says why. */
  favourite?: boolean;
  onToggleFavourite?: () => void;
};

export const VenueCard: React.FC<Props> = ({
  place,
  userLocation,
  onPress,
  favourite = false,
  onToggleFavourite,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { phone, rating, openNow } = place;

  const bearing = userLocation
    ? calculateBearing(userLocation.lat, userLocation.lng, place.lat, place.lng)
    : null;

  return (
    <Pressable style={[styles.card, favourite && styles.cardFavourite]} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <View style={styles.metaRow}>
            {place.category !== "other" && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{CATEGORY_LABELS[place.category]}</Text>
              </View>
            )}
            {openNow != null && (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, !openNow && styles.statusDotClosed]} />
                <Text style={[styles.statusText, !openNow && styles.statusTextClosed]}>
                  {openNow ? "Open now" : "Closed"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {place.name}
            </Text>
            {rating != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={colors.secondary} />
            <Text style={styles.address} numberOfLines={1}>
              {place.vicinity}
            </Text>
            <Text style={styles.walkTime}>• {formatWalkTime(place.distance)}</Text>
          </View>
        </View>

        <View style={styles.distanceCol}>
          <View style={styles.distancePill}>
            <Ionicons name="navigate" size={13} color={colors.primary} />
            <Text style={styles.distanceText}>{formatDistance(place.distance)}</Text>
          </View>
          {bearing != null && (
            <Text style={styles.bearingText}>
              {bearingToCardinal(bearing)} {Math.round(bearing)}°
            </Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          {onToggleFavourite && (
            <Pressable
              style={[styles.actionBtn, favourite && styles.actionBtnActive]}
              onPress={onToggleFavourite}
              hitSlop={6}
              accessibilityRole="switch"
              accessibilityState={{ checked: favourite }}
              accessibilityLabel={favourite ? `Unpin ${place.name}` : `Pin ${place.name}`}
            >
              <Ionicons
                name={favourite ? "star" : "star-outline"}
                size={13}
                color={favourite ? colors.primary : colors.body}
              />
            </Pressable>
          )}
          {phone && (
            <Pressable style={styles.actionBtn} onPress={() => callStore(phone)}>
              <Ionicons name="call-outline" size={13} color={colors.primary} />
              <Text style={styles.actionBtnText}>Call</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={styles.guideBtn} onPress={() => openInMaps(place)}>
          <Text style={styles.guideBtnText}>Guide</Text>
          <Ionicons name="navigate-outline" size={14} color={colors.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  cardFavourite: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardMain: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusDotClosed: {
    backgroundColor: colors.muted,
  },
  statusText: {
    color: colors.body,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  statusTextClosed: {
    color: colors.muted,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  address: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    flexShrink: 1,
  },
  walkTime: {
    color: colors.body,
    fontFamily: fonts.label,
    fontSize: 11,
  },
  distanceCol: {
    alignItems: "flex-end",
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  distanceText: {
    color: colors.headline,
    fontFamily: fonts.labelBold,
    fontSize: 14,
  },
  bearingText: {
    color: colors.body,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  actionBtnText: {
    color: colors.headline,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  guideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  guideBtnText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
}));
