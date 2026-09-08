import { Animated, StyleSheet, Text, View } from "react-native";
import React from "react";
import { classic, fonts } from "../theme";
import { COMPASS_SIZE, rosePoint, toDeg, useLoadingPulse, useTargetLabel } from "./compassShared";
import type { CompassProps } from "./compassShared";

const BEZEL_WIDTH = Math.round(COMPASS_SIZE * 0.045);
const CARD_SIZE = COMPASS_SIZE - BEZEL_WIDTH * 2;
const CARD_R = CARD_SIZE / 2;

const TICK_INSET = 2;
const RING_OUTER_R = CARD_R * 0.875;
const LABEL_R = CARD_R * 0.775;
const RING_INNER_R = CARD_R * 0.665;
const ROSE_R = CARD_R * 0.645;

const LABEL_BOX = CARD_R * 0.34;
const CARDINAL_SIZE = Math.round(CARD_R * 0.145);
const NUMBER_SIZE = Math.round(CARD_R * 0.095);

const HUB_SIZE = Math.round(CARD_R * 0.14);

const NEEDLE_LEN = ROSE_R * 0.93;
const NEEDLE_TAIL = ROSE_R * 0.42;
const NEEDLE_HW = Math.max(3, ROSE_R * 0.055);

const POINT_LIGHT = "#1e1d1a";

const ringStyle = (radius: number, borderWidth: number, borderColor: string) =>
  ({
    position: "absolute",
    width: radius * 2,
    height: radius * 2,
    borderRadius: radius,
    borderWidth,
    borderColor,
  }) as const;

const RING_OUTER = ringStyle(RING_OUTER_R, 1.5, classic.inkSoft);
const RING_INNER = ringStyle(RING_INNER_R, 1, classic.inkFaint);

const TICK_STYLES = Array.from({ length: 72 }, (_, i) => {
  const deg = i * 5;
  const isMajor = deg % 30 === 0;
  const isMid = deg % 15 === 0;
  const height = isMajor ? CARD_R * 0.075 : isMid ? CARD_R * 0.05 : CARD_R * 0.03;
  return {
    transform: [{ rotate: `${deg}deg` }, { translateY: -(CARD_R - TICK_INSET - height) }],
    height,
    width: isMajor ? 1.6 : 1,
    backgroundColor: isMajor ? classic.ink : classic.inkSoft,
  } as const;
});

const labelStyle = (deg: number) =>
  ({
    position: "absolute",
    top: "50%",
    left: "50%",
    width: LABEL_BOX,
    marginLeft: -LABEL_BOX / 2,
    marginTop: -LABEL_BOX / 2,
    height: LABEL_BOX,
    lineHeight: LABEL_BOX,
    textAlign: "center",
    transform: [{ rotate: `${deg}deg` }, { translateY: -LABEL_R }],
  }) as const;

const CARDINAL_LABELS = [
  { deg: 0, text: "N" },
  { deg: 90, text: "E" },
  { deg: 180, text: "S" },
  { deg: 270, text: "W" },
].map(({ deg, text }) => ({ text, style: labelStyle(deg), isNorth: deg === 0 }));

const DEGREE_LABELS = [30, 60, 120, 150, 210, 240, 300, 330].map((deg) => ({
  text: String(deg),
  style: labelStyle(deg),
}));

// Cardinals get the long points, the ordinals two-thirds of that, and the eight
// half-winds the short stubs — the standard 16-point rose.
const pointMetrics = (deg: number) => {
  if (deg % 90 === 0) return { len: ROSE_R, hw: ROSE_R * 0.115 };
  if (deg % 45 === 0) return { len: ROSE_R * 0.7, hw: ROSE_R * 0.085 };
  return { len: ROSE_R * 0.4, hw: ROSE_R * 0.05 };
};

// Shading every point the same way round gives the rose its engraved,
// lit-from-one-side look. North is picked out in gold rather than ink.
const ROSE_POINTS = Array.from({ length: 16 }, (_, i) => i * 22.5).map((deg) => {
  const { len, hw } = pointMetrics(deg);
  const isNorth = deg === 0;
  return rosePoint({
    deg,
    len,
    halfWidth: hw,
    shadowColor: isNorth ? classic.gold : classic.ink,
    litColor: isNorth ? classic.goldLight : POINT_LIGHT,
  });
});

// Memoized on one stable prop: the rose is ~130 views and the parent re-renders
// on every position update as `store.distance` recomputes.
const CompassRose = React.memo<{ dialAngle: Animated.Value }>(({ dialAngle }) => (
  <Animated.View
    style={[styles.card, { transform: [{ rotate: toDeg(dialAngle) }] }]}
    pointerEvents="none"
  >
    {TICK_STYLES.map((tickStyle, i) => (
      <View key={i} style={[styles.tick, tickStyle]} />
    ))}

    <View style={RING_OUTER} />
    <View style={RING_INNER} />

    {ROSE_POINTS.map((point, i) => (
      <View key={i} style={point.wrap}>
        <View style={point.shadow} />
        <View style={point.lit} />
      </View>
    ))}

    {DEGREE_LABELS.map(({ text, style }) => (
      <Text key={text} style={[styles.degreeLabel, style]}>
        {text}
      </Text>
    ))}

    {CARDINAL_LABELS.map(({ text, style, isNorth }) => (
      <Text key={text} style={[styles.cardinalLabel, isNorth && styles.cardinalNorth, style]}>
        {text}
      </Text>
    ))}
  </Animated.View>
));

const ClassicCompassInner: React.FC<CompassProps> = ({
  needleAngle,
  dialAngle,
  store,
  userLocation,
  loading = false,
}) => {
  const pulseAnim = useLoadingPulse(loading);
  const rotate = toDeg(needleAngle);
  const targetLabel = useTargetLabel(store, userLocation);

  return (
    <View style={styles.wrap}>
      {loading && (
        <Animated.View style={[styles.loadingRing, { opacity: pulseAnim }]} pointerEvents="none" />
      )}

      <View style={styles.bezel}>
        <View style={styles.cardWell}>
          {/* The rose turns with the world; the needle, hub and index mark stay
              pinned to the screen. */}
          <CompassRose dialAngle={dialAngle} />

          <Animated.View style={[styles.needleHead, { transform: [{ rotate }] }]}>
            <View style={styles.needleHeadShadow} />
            <View style={styles.needleHeadLit} />
          </Animated.View>
          <Animated.View style={[styles.needleTail, { transform: [{ rotate }] }]}>
            <View style={styles.needleTailShadow} />
            <View style={styles.needleTailLit} />
          </Animated.View>

          <View style={styles.hub} />

          {targetLabel && (
            <View style={styles.labelPlate} pointerEvents="none">
              <Text style={styles.labelText}>{targetLabel}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Index mark cut into the bezel at 12 o'clock — the heading you're facing
          is whatever sits under it on the rose. */}
      <View style={styles.indexMark} pointerEvents="none" />
    </View>
  );
};

export const ClassicCompass = React.memo(ClassicCompassInner);

const styles = StyleSheet.create({
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
    borderColor: classic.goldLight,
  },
  bezel: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: classic.bezel,
    borderWidth: 2,
    borderColor: classic.bezelEdge,
    alignItems: "center",
    justifyContent: "center",
  },
  cardWell: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_R,
    backgroundColor: classic.card,
    borderWidth: 1,
    borderColor: classic.bezelInner,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Fills the well's content box rather than restating CARD_SIZE, so the rose
  // stays centred on the true centre and not one border-width off it.
  card: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -1,
    transformOrigin: "top",
  },
  cardinalLabel: {
    fontFamily: fonts.serif,
    fontWeight: "700",
    fontSize: CARDINAL_SIZE,
    color: classic.ink,
  },
  cardinalNorth: {
    color: classic.gold,
  },
  degreeLabel: {
    fontFamily: fonts.serif,
    fontSize: NUMBER_SIZE,
    color: classic.inkSoft,
  },
  needleHead: {
    position: "absolute",
    top: "50%",
    left: "50%",
    flexDirection: "row",
    alignItems: "flex-start",
    width: NEEDLE_HW * 2,
    height: NEEDLE_LEN,
    marginLeft: -NEEDLE_HW,
    marginTop: -NEEDLE_LEN,
    transformOrigin: "bottom",
  },
  needleHeadShadow: {
    width: 0,
    height: 0,
    borderLeftWidth: NEEDLE_HW,
    borderLeftColor: "transparent",
    borderBottomWidth: NEEDLE_LEN,
    borderBottomColor: "#6E1F16",
  },
  needleHeadLit: {
    width: 0,
    height: 0,
    borderRightWidth: NEEDLE_HW,
    borderRightColor: "transparent",
    borderBottomWidth: NEEDLE_LEN,
    borderBottomColor: classic.needle,
  },
  // Counterweight tail, so the needle reads as balanced on the pivot rather than
  // as an arrow stuck to the middle of the card.
  needleTail: {
    position: "absolute",
    top: "50%",
    left: "50%",
    flexDirection: "row",
    alignItems: "flex-start",
    width: NEEDLE_HW * 2,
    height: NEEDLE_TAIL,
    marginLeft: -NEEDLE_HW,
    transformOrigin: "top",
  },
  needleTailShadow: {
    width: 0,
    height: 0,
    borderLeftWidth: NEEDLE_HW,
    borderLeftColor: "transparent",
    borderTopWidth: NEEDLE_TAIL,
    borderTopColor: classic.ink,
  },
  needleTailLit: {
    width: 0,
    height: 0,
    borderRightWidth: NEEDLE_HW,
    borderRightColor: "transparent",
    borderTopWidth: NEEDLE_TAIL,
    borderTopColor: "#6B5433",
  },
  hub: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: HUB_SIZE,
    height: HUB_SIZE,
    marginTop: -HUB_SIZE / 2,
    marginLeft: -HUB_SIZE / 2,
    borderRadius: HUB_SIZE / 2,
    borderWidth: 1.5,
    borderColor: classic.bezelInner,
    backgroundColor: classic.goldLight,
  },
  indexMark: {
    position: "absolute",
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderLeftColor: "transparent",
    borderRightWidth: 7,
    borderRightColor: "transparent",
    borderTopWidth: 12,
    borderTopColor: classic.bezelEdge,
  },
  labelPlate: {
    position: "absolute",
    bottom: CARD_R * 0.22,
    backgroundColor: classic.card,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: classic.inkSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  labelText: {
    color: classic.ink,
    fontFamily: fonts.serif,
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
