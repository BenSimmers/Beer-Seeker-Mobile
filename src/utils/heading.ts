import * as Location from "expo-location";
import { DeviceMotion } from "expo-sensors";
import { compassLogger as log } from "../logger";
import { shortestDelta, wrap360 } from "./geo";

// 60 Hz. expo-location's heading stream arrives at whatever rate the platform
// picks and is magnetometer-driven — noisy, and too sparse to interpolate
// convincingly. Device motion is gyro-fused and rate-controllable, which is
// what makes a fast turn read as continuous instead of stepped.
const MOTION_INTERVAL_MS = 16;

// Share of the motion/compass disagreement we absorb per compass sample. Kept
// low on purpose: the fused heading should follow the gyro moment to moment and
// let the magnetometer steer it over about a second. That's what keeps a fast
// turn smooth while still pinning the card to real north.
const OFFSET_CORRECTION = 0.05;

const RAD_TO_DEG = 180 / Math.PI;

export type HeadingWatcher = { remove: () => void };

/**
 * Absolute compass heading in degrees, fused from two sources: device motion
 * for speed and smoothness, the magnetometer for knowing where north is.
 *
 * Device motion yaw is smooth but its zero is not ours to assume — iOS reports
 * CoreMotion yaw against a magnetic-north reference frame, Android reports a
 * negated rotation-vector azimuth, and the two don't share an origin. Rather
 * than hard-code a per-platform constant, we measure the offset against the
 * magnetometer's absolute heading and keep nudging it, which also mops up gyro
 * drift for free.
 */
export const watchFusedHeading = async (
  onHeading: (deg: number) => void,
): Promise<HeadingWatcher> => {
  let yaw: number | null = null;
  let offset: number | null = null;

  let motionSub: { remove: () => void } | null = null;
  if (await DeviceMotion.isAvailableAsync()) {
    DeviceMotion.setUpdateInterval(MOTION_INTERVAL_MS);
    motionSub = DeviceMotion.addListener(({ rotation }) => {
      if (!rotation) return;
      yaw = -rotation.alpha * RAD_TO_DEG;
      if (offset !== null) onHeading(wrap360(yaw + offset));
    });
  }

  const compassSub = await Location.watchHeadingAsync((h) => {
    // True north to match calculateBearing. trueHeading is -1 until there's a fix.
    const absolute = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
    if (yaw === null) {
      onHeading(absolute);
      return;
    }
    const target = shortestDelta(0, absolute - yaw);
    if (offset === null) {
      log.debug(`heading fused — motion yaw offset ${target.toFixed(1)}°`);
      offset = target;
      return;
    }
    offset += shortestDelta(offset, target) * OFFSET_CORRECTION;
  });

  return {
    remove: () => {
      motionSub?.remove();
      compassSub.remove();
    },
  };
};
