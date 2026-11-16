export const NUDGE_HOUR = 18;
export const NUDGE_DAYS = [5, 6] as const;
export const NUDGE_GRACE_MS = 60 * 60_000;

const DAY_MS = 24 * 60 * 60_000;

const formatters = new Map<string, Intl.DateTimeFormat>();
const formatter = (timeZone: string) => {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
};

export const isValidTimeZone = (timeZone: string) => {
  if (!timeZone || timeZone.length > 64) return false;
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
};

const localParts = (timeZone: string, t: number) => {
  const out: Record<string, number> = {};
  for (const p of formatter(timeZone).formatToParts(t)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return { y: out.year!, m: out.month!, d: out.day!, h: out.hour!, min: out.minute! };
};

const offsetAt = (timeZone: string, t: number) => {
  const { y, m, d, h, min } = localParts(timeZone, t);
  return Date.UTC(y, m - 1, d, h, min) - (t - (t % 60_000));
};

const localToUtc = (timeZone: string, y: number, m: number, d: number, hour: number) => {
  const wall = Date.UTC(y, m - 1, d, hour);
  // Second pass settles days when the offset changes (DST).
  const first = wall - offsetAt(timeZone, wall);
  return wall - offsetAt(timeZone, first);
};

export const nextNudgeAt = (timeZone: string, now: number) => {
  const { y, m, d } = localParts(timeZone, now);
  for (let i = 0; i <= 8; i++) {
    const day = new Date(Date.UTC(y, m - 1, d) + i * DAY_MS);
    if (!(NUDGE_DAYS as readonly number[]).includes(day.getUTCDay())) continue;
    const at = localToUtc(
      timeZone,
      day.getUTCFullYear(),
      day.getUTCMonth() + 1,
      day.getUTCDate(),
      NUDGE_HOUR,
    );
    if (at > now) return at;
  }
  throw new Error(`No nudge time found for ${timeZone}`);
};

export const localWeekday = (timeZone: string, t: number) => {
  const { y, m, d } = localParts(timeZone, t);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 5 ? "Friday" : "Saturday";
};
