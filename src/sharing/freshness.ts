import { formatDistance } from "../utils/geo";

/** A friend's fix older than this is "last seen", not live. */
export const STALE_AFTER_MS = 2 * 60_000;

/** Beyond this radius the needle is a rough direction, not a pinpoint. */
export const IMPRECISE_ABOVE_M = 75;

export type FixQuality = {
  /** e.g. "Updated just now", "Last seen 12 min ago". */
  label: string;
  warning: "stale" | "imprecise" | null;
  /** e.g. "±120 m", only when imprecise. */
  accuracyLabel: string | null;
};

const ago = (ms: number): string => {
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} h ago`;
};

export const describeFix = (
  fix: { updatedAt: number; accuracy: number | null },
  now: number,
): FixQuality => {
  const age = Math.max(0, now - fix.updatedAt);
  const stale = age > STALE_AFTER_MS;
  const imprecise = fix.accuracy !== null && fix.accuracy > IMPRECISE_ABOVE_M;
  return {
    label: stale ? `Last seen ${ago(age)}` : `Updated ${ago(age)}`,
    // Staleness wins: an old fix is wrong however precise it was.
    warning: stale ? "stale" : imprecise ? "imprecise" : null,
    accuracyLabel: imprecise ? `±${formatDistance(fix.accuracy ?? 0)}` : null,
  };
};

/** "52 min left", "3 h 10 min left". */
export const timeLeft = (expiresAt: number, now: number): string => {
  const mins = Math.max(1, Math.ceil((expiresAt - now) / 60_000));
  if (mins < 60) return `${mins} min left`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours} h left` : `${hours} h ${rest} min left`;
};
