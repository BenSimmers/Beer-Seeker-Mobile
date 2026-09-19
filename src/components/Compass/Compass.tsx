import React from "react";
import { Pressable } from "react-native";
import { usePreferences } from "../../preferences";
import { ClassicCompass } from "../ClassicCompass";
import { ModernCompass } from "../ModernCompass";
import type { CompassProps } from "../compassShared";
import { useStyles } from "./styles";

export { COMPASS_SIZE } from "../compassShared";
export type { CompassProps } from "../compassShared";

export const Compass: React.FC<CompassProps> = ({ onPress, ...props }) => {
  const { compassStyle } = usePreferences();
  const styles = useStyles();
  const compass =
    compassStyle === "classic" ? <ClassicCompass {...props} /> : <ModernCompass {...props} />;

  if (!onPress) return compass;

  return (
    <Pressable onPress={onPress} style={styles.compass}>
      {compass}
    </Pressable>
  );
};
