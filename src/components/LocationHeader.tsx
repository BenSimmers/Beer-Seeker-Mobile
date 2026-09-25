import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFavourites } from "../favourites";
import type { CompassStackParamList } from "../navigation/types";
import type { UserLocation } from "../types";
import { fonts, makeStyles, useTheme } from "../theme";

type Props = {
  location: UserLocation | null;
};

export const LocationHeader: React.FC<Props> = ({ location }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<CompassStackParamList>>();
  const { favourites } = useFavourites();

  if (!location) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="location-outline" size={16} color={colors.muted} />
        <Text style={styles.text} numberOfLines={1}>
          {`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
        </Text>
      </View>

      <Pressable
        style={styles.favBtn}
        onPress={() => navigation.navigate("Favourites")}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Favourites"
      >
        <Ionicons
          name={favourites.length > 0 ? "star" : "star-outline"}
          size={18}
          color={favourites.length > 0 ? colors.primary : colors.muted}
        />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  text: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  favBtn: {
    padding: 4,
  },
  gpsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  gpsText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 0.5,
  },
}));
