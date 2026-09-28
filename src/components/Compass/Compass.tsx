import React from "react";
import { Pressable, View } from "react-native";
import { usePreferences } from "../../preferences";
import { ClassicCompass } from "../ClassicCompass";
import { ModernCompass } from "../ModernCompass";
import { compassAccessibilityLabel } from "../compassShared";
import type { CompassProps } from "../compassShared";
import { useStyles } from "./styles";

export { COMPASS_SIZE } from "../compassShared";
export type { CompassProps } from "../compassShared";

export const Compass: React.FC<CompassProps> = ({ onPress, ...props }) => {
  const { compassStyle } = usePreferences();
  const styles = useStyles();
  const compass =
    compassStyle === "classic" ? <ClassicCompass {...props} /> : <ModernCompass {...props} />;
  // One element for VoiceOver: the ticks, letters and needle are read as this
  // sentence rather than as a scatter of loose "N", "S", "E", "W".
  const accessibilityLabel = compassAccessibilityLabel(
    props.store,
    props.userLocation,
    props.loading ?? false,
  );

  if (!onPress) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        {compass}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={styles.compass}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Searches again from where you are"
    >
      {compass}
    </Pressable>
  );
};
