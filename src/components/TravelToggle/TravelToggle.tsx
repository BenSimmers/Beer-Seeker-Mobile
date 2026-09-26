import React, { useState } from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../../location";
import { useTheme } from "../../theme";
import { TravelSearchModal } from "../TravelSearchModal";
import { useStyles } from "./styles";

type Props = {
  wide?: boolean;
};

export const TravelToggle: React.FC<Props> = ({ wide = false }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { travelOrigin, realLocation, setTravelOrigin, clearTravelOrigin } = useLocation();
  const [searchVisible, setSearchVisible] = useState(false);

  return (
    <>
      {travelOrigin ? (
        <Pressable
          style={[styles.pill, wide && styles.pillWide]}
          onPress={() => setSearchVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Travel mode on, ${travelOrigin.label}. Change location`}
        >
          <Ionicons name="airplane" size={13} color={colors.secondary} />
          <Text style={styles.pillText} numberOfLines={1}>
            {travelOrigin.label}
          </Text>
          <Pressable
            onPress={clearTravelOrigin}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Turn off travel mode"
          >
            <Ionicons name="close" size={15} color={colors.secondary} />
          </Pressable>
        </Pressable>
      ) : (
        <Pressable
          style={styles.iconBtn}
          onPress={() => setSearchVisible(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Travel mode"
        >
          <Ionicons name="airplane-outline" size={18} color={colors.muted} />
        </Pressable>
      )}

      <TravelSearchModal
        visible={searchVisible}
        realLocation={realLocation}
        onConfirm={setTravelOrigin}
        onClose={() => setSearchVisible(false)}
      />
    </>
  );
};
