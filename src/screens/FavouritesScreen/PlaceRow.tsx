import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui";
import type { FavouriteInput } from "../../favourites";
import { fonts, makeStyles, useTheme } from "../../theme";
import { CATEGORY_LABELS, type UserLocation } from "../../types";
import {
  bearingToCardinal,
  calculateBearing,
  formatDistance,
  haversineDistance,
} from "../../utils/geo";

type Props = {
  place: FavouriteInput;
  userLocation: UserLocation | null;
  favourite: boolean;
  onToggle: () => void;
  onPress: () => void;
};

export const PlaceRow: React.FC<Props> = ({
  place,
  userLocation,
  favourite,
  onToggle,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const distance = userLocation
    ? haversineDistance(userLocation.lat, userLocation.lng, place.lat, place.lng)
    : null;
  const bearing = userLocation
    ? calculateBearing(userLocation.lat, userLocation.lng, place.lat, place.lng)
    : null;

  return (
    <Card
      style={styles.row}
      selected={favourite}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Point the compass at ${place.name}`}
    >
      <Pressable
        style={styles.star}
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="switch"
        accessibilityState={{ checked: favourite }}
        accessibilityLabel={favourite ? `Unpin ${place.name}` : `Pin ${place.name}`}
      >
        <Ionicons
          name={favourite ? "star" : "star-outline"}
          size={20}
          color={favourite ? colors.primary : colors.muted}
        />
      </Pressable>

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {place.category !== "other" ? `${CATEGORY_LABELS[place.category]} · ` : ""}
          {place.vicinity}
        </Text>
        {distance != null && bearing != null && (
          <Text style={styles.distance}>
            {formatDistance(distance)} · {bearingToCardinal(bearing)}
          </Text>
        )}
      </View>

      <Ionicons name="compass-outline" size={18} color={colors.primary} />
    </Card>
  );
};

const useStyles = makeStyles((colors) => ({
  row: {
    marginBottom: 10,
  },
  star: {
    width: 26,
    alignItems: "center",
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
  distance: {
    color: colors.body,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 4,
  },
}));
