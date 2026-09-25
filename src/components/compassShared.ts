import { useEffect, useMemo, useState } from "react";
import { Animated, Dimensions } from "react-native";
import type { LiquorStore, UserLocation } from "../types";
import { bearingToCardinal, calculateBearing, formatDistance } from "../utils/geo";

const { width } = Dimensions.get("window");

export const COMPASS_SIZE = Math.min(width * 0.68, 250);

export interface CompassProps {
  needleAngle: Animated.Value;
  dialAngle: Animated.Value;
  store: LiquorStore | null;
  userLocation: UserLocation | null;
  loading?: boolean;
  onPress?: () => void;
}

// The hook feeds these unwrapped degrees, so map 1:1 and extend past the range
// rather than clamping at a full turn.
export const toDeg = (value: Animated.Value) =>
  value.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "1deg"],
    extrapolate: "extend",
  });

type RosePointOptions = {
  deg: number;
  len: number;
  halfWidth: number;
  shadowColor: string;
  litColor: string;
};

export const rosePoint = ({ deg, len, halfWidth, shadowColor, litColor }: RosePointOptions) =>
  ({
    wrap: {
      position: "absolute",
      top: "50%",
      left: "50%",
      flexDirection: "row",
      alignItems: "flex-start",
      width: halfWidth * 2,
      height: len,
      marginLeft: -halfWidth,
      marginTop: -len,
      transformOrigin: "bottom",
      transform: [{ rotate: `${deg}deg` }],
    },
    shadow: {
      width: 0,
      height: 0,
      borderLeftWidth: halfWidth,
      borderLeftColor: "transparent",
      borderBottomWidth: len,
      borderBottomColor: shadowColor,
    },
    lit: {
      width: 0,
      height: 0,
      borderRightWidth: halfWidth,
      borderRightColor: "transparent",
      borderBottomWidth: len,
      borderBottomColor: litColor,
    },
  }) as const;

// Pulses an opacity value while loading, and parks it at 1 otherwise.
export const useLoadingPulse = (loading: boolean): Animated.Value => {
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!loading) {
      pulseAnim.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [loading, pulseAnim]);

  return pulseAnim;
};

// Absolute (not heading-relative) direction, so the label doesn't flicker as the
// phone turns.
export const useTargetLabel = (
  store: LiquorStore | null,
  userLocation: UserLocation | null,
): string | null =>
  useMemo(() => {
    if (!store || !userLocation) return null;
    const bearing = calculateBearing(userLocation.lat, userLocation.lng, store.lat, store.lng);
    return `${formatDistance(store.distance)} · ${bearingToCardinal(bearing)}`;
  }, [store, userLocation]);
