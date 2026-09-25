import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { shortestDelta, wrap360 } from "../utils/geo";

const HEADING_EPSILON_DEG = 0.5;

// Low-pass time constant, in ms rather than a per-sample fraction, so the
// filter behaves the same whether samples arrive at 60 Hz or 10 Hz.
const HEADING_TAU_MS = 80;

// Turn rate at which we stop filtering and track the sensor exactly. Below it
// we're mostly seeing noise; above it the user is genuinely turning, and any
// smoothing there is just lag. Rate-based, so this too is sample-rate agnostic.
const HEADING_FULL_TRACKING_DPS = 90;

// Each rotation is a linear segment sized to bridge one sample to the next, so
// the card turns at constant speed instead of easing to a stop and restarting.
// Linear matters: an eased curve restarted every sample decelerates over and
// over, which is what reads as stutter.
const ROTATION_MIN_MS = 16;

const ROTATION_MAX_MS = 220;

// Below this, the sensor is already reporting about once per frame, so an
// animation would only add a frame of lag to something that needs none — write
// the value straight through instead.
const ROTATION_DIRECT_MS = 32;

// Run each segment slightly past the measured gap — if the next sample is a
// little late, the card keeps gliding instead of parking until it arrives.
const ROTATION_SLACK = 1.25;

// A new target is a jump, not a turn: give the needle its own travel time so it
// swings across rather than teleporting.
const BEARING_SETTLE_MS = 320;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type CompassAnimation = {
  /** Rotation of the needle, in unwrapped degrees. Points at the target. */
  needleAngle: Animated.Value;
  /** Rotation of the compass card, in unwrapped degrees. Counter-turns to hold north. */
  dialAngle: Animated.Value;
  /** Feed every raw heading sample here, in degrees. */
  onHeading: (raw: number) => void;
};

/**
 * Drives the two hands of the compass from a stream of heading samples and an
 * absolute bearing to the target. Knows nothing about sensors, geography or
 * stores — just angles in, animated values out.
 */
export const useCompassAnimation = (bearing: number | null): CompassAnimation => {
  const [needleAngle] = useState(() => new Animated.Value(0));
  const [dialAngle] = useState(() => new Animated.Value(0));
  const headingRef = useRef(0);
  const bearingRef = useRef<number | null>(null);
  const lastNeedleRef = useRef(0);
  const lastDialRef = useRef(0);
  const lastSampleAtRef = useRef(0);

  const rotateTo = useCallback(
    (value: Animated.Value, last: { current: number }, target: number, duration: number) => {
      const next = last.current + shortestDelta(last.current, target);
      last.current = next;
      if (duration <= ROTATION_DIRECT_MS) {
        value.setValue(next);
        return;
      }
      Animated.timing(value, {
        toValue: next,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    },
    [],
  );

  const animateDial = useCallback(
    (duration: number) => {
      rotateTo(dialAngle, lastDialRef, -headingRef.current, duration);
    },
    [dialAngle, rotateTo],
  );

  const animateNeedle = useCallback(
    (duration: number) => {
      const target = bearingRef.current;
      if (target === null) return;
      rotateTo(needleAngle, lastNeedleRef, target - headingRef.current, duration);
    },
    [needleAngle, rotateTo],
  );

  const onHeading = useCallback(
    (raw: number) => {
      const now = Date.now();
      const gap = lastSampleAtRef.current ? now - lastSampleAtRef.current : ROTATION_MAX_MS;
      lastSampleAtRef.current = now;

      const delta = shortestDelta(headingRef.current, raw);
      // A resting phone still reports sub-degree wobble; ignoring it outright
      // beats filtering it, and saves the work entirely while standing still.
      if (Math.abs(delta) < HEADING_EPSILON_DEG) return;

      const settled = 1 - Math.exp(-gap / HEADING_TAU_MS);
      const turnRate = Math.abs(delta) / (gap / 1000);
      const smoothing = clamp(settled + turnRate / HEADING_FULL_TRACKING_DPS, settled, 1);
      headingRef.current = wrap360(headingRef.current + delta * smoothing);

      const duration = clamp(gap * ROTATION_SLACK, ROTATION_MIN_MS, ROTATION_MAX_MS);
      animateDial(duration);
      animateNeedle(duration);
    },
    [animateDial, animateNeedle],
  );

  useEffect(() => {
    bearingRef.current = bearing;
    if (bearing !== null) animateNeedle(BEARING_SETTLE_MS);
  }, [bearing, animateNeedle]);

  return { needleAngle, dialAngle, onHeading };
};
