import { Animated, Text, View } from "react-native";
import React from "react";
import { fonts, makeStyles, makeThemed } from "../theme";
import { COMPASS_SIZE, toDeg, useLoadingPulse, useTargetLabel } from "./compassShared";
import type { CompassProps } from "./compassShared";

const NEEDLE_LENGTH = COMPASS_SIZE * 0.33;

const useTickStyles = makeThemed((colors) =>
  Array.from({ length: 72 }, (_, i) => {
    const deg = i * 5;
    const isCardinal = deg % 90 === 0;
    const isIntercardinal = deg % 45 === 0;
    return {
      transform: [{ rotate: `${deg}deg` }, { translateY: -(COMPASS_SIZE / 2 - 14) }],
      height: isCardinal ? 14 : isIntercardinal ? 9 : 5,
      width: isCardinal ? 2 : 1,
      backgroundColor: isCardinal ? colors.secondary : colors.dialTick,
    } as const;
  }),
);

const CompassDial = React.memo<{ dialAngle: Animated.Value }>(({ dialAngle }) => {
  const styles = useStyles();
  const tickStyles = useTickStyles();

  return (
    <Animated.View
      style={[styles.dial, { transform: [{ rotate: toDeg(dialAngle) }] }]}
      pointerEvents="none"
    >
      {tickStyles.map((tickStyle, i) => (
        <View key={i} style={[styles.tick, tickStyle]} />
      ))}

      <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
      <Text style={[styles.cardinal, styles.cardinalMuted, styles.cardinalS]}>S</Text>
      <Text style={[styles.cardinal, styles.cardinalMuted, styles.cardinalE]}>E</Text>
      <Text style={[styles.cardinal, styles.cardinalMuted, styles.cardinalW]}>W</Text>
    </Animated.View>
  );
});

const ModernCompassInner: React.FC<CompassProps> = ({
  needleAngle,
  dialAngle,
  store,
  userLocation,
  loading = false,
}) => {
  const styles = useStyles();
  const pulseAnim = useLoadingPulse(loading);
  const rotate = toDeg(needleAngle);
  const targetLabel = useTargetLabel(store, userLocation);

  return (
    <View style={styles.wrap}>
      {loading && (
        <Animated.View style={[styles.loadingRing, { opacity: pulseAnim }]} pointerEvents="none" />
      )}
      <View style={styles.compassFace}>
        <CompassDial dialAngle={dialAngle} />

        <View style={styles.lubberLine} pointerEvents="none" />

        <Animated.View style={[styles.needle, { transform: [{ rotate }] }]} />
        <View style={styles.pivot} />

        {targetLabel && (
          <View style={styles.labelPill} pointerEvents="none">
            <Text style={styles.labelText}>{targetLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export const ModernCompass = React.memo(ModernCompassInner);

const useStyles = makeStyles((colors) => ({
  wrap: {
    width: COMPASS_SIZE + 16,
    height: COMPASS_SIZE + 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  loadingRing: {
    position: "absolute",
    width: COMPASS_SIZE + 16,
    height: COMPASS_SIZE + 16,
    borderRadius: (COMPASS_SIZE + 16) / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  compassFace: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  dial: {
    position: "absolute",
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  // Fixed index mark at 12 o'clock — the heading you're facing is whatever sits
  // under it on the card.
  lubberLine: {
    position: "absolute",
    top: 4,
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  tick: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -1,
    transformOrigin: "top",
  },
  cardinal: {
    position: "absolute",
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
    color: colors.primary,
  },
  cardinalMuted: {
    color: colors.muted,
  },
  cardinalN: { top: 30 },
  cardinalS: { bottom: 30 },
  cardinalE: { right: 30 },
  cardinalW: { left: 30 },
  needle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 2.5,
    height: NEEDLE_LENGTH,
    marginLeft: -1.25,
    marginTop: -NEEDLE_LENGTH,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    transformOrigin: "bottom",
  },
  pivot: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 16,
    height: 16,
    marginTop: -8,
    marginLeft: -8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  labelPill: {
    position: "absolute",
    bottom: 50,
    backgroundColor: colors.surfaceAlt + "ee",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelText: {
    color: colors.headline,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
}));
