import type { Origin } from "../types";
import { asNumber, asRecord, asString } from "../utils/parse";

export type TravelOrigin = {
  label: string;
  lat: number;
  lng: number;
  setAt: number;
};

export const travelToOrigin = (travel: TravelOrigin): Origin => ({
  lat: travel.lat,
  lng: travel.lng,
  source: "travel",
  label: travel.label,
});

const inRange = (v: number | undefined, limit: number): v is number =>
  v != null && Math.abs(v) <= limit;

export const parseTravelOrigin = (value: unknown): TravelOrigin | null => {
  const o = asRecord(value);
  if (!o) return null;

  const label = asString(o.label);
  const lat = asNumber(o.lat);
  const lng = asNumber(o.lng);
  if (!label || !inRange(lat, 90) || !inRange(lng, 180)) return null;

  return { label, lat, lng, setAt: asNumber(o.setAt) ?? 0 };
};
