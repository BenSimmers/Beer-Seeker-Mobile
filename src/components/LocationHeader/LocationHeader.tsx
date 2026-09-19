import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { UserLocation } from "../../types";
import { useTheme } from "../../theme";
import { useStyles } from "./styles";

type Props = {
  location: UserLocation | null;
};

export const LocationHeader: React.FC<Props> = ({ location }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  if (!location) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="location-outline" size={16} color={colors.muted} />
        <Text style={styles.text} numberOfLines={1}>
          {`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
        </Text>
      </View>
      <View style={styles.gpsIndicator}>
        <View style={styles.gpsDot} />
        <Text style={styles.gpsText}>GPS</Text>
      </View>
    </View>
  );
};
