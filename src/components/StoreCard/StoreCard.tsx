import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import type { LiquorStore, UserLocation } from "../../types";
import { useTheme } from "../../theme";
import { useStyles } from "./styles";
import {
  formatDistance,
  formatWalkTime,
  calculateBearing,
  bearingToCardinal,
} from "../../utils/geo";
import { openInMaps } from "../../services/storeInteractions";

type Props = {
  store: LiquorStore;
  dimmed?: boolean;
  userLocation?: UserLocation | null;
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
