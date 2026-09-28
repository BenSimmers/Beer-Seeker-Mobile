import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFavourites } from "../../favourites";
import type { CompassStackParamList } from "../../navigation/types";
import type { Origin } from "../../types";
import { useTheme } from "../../theme";
import { useStyles } from "./styles";
import { TravelToggle } from "../TravelToggle";

type Props = {
  location: Origin | null;
};

export const LocationHeader: React.FC<Props> = ({ location }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<CompassStackParamList>>();
  const { favourites } = useFavourites();

  if (!location) return null;
  const travelling = location.source === "travel";

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {travelling ? (
          <TravelToggle wide />
        ) : (
          <>
            <Ionicons name="location-outline" size={16} color={colors.muted} />
            <Text style={styles.text} numberOfLines={1}>
              {`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </Text>
          </>
        )}
      </View>

      <View style={styles.actions}>
        {!travelling && <TravelToggle />}
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
    </View>
  );
};
