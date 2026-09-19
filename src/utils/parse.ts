export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const asRecord = (v: unknown): Record<string, unknown> | undefined =>
  isRecord(v) ? v : undefined;

export const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export const asNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

export const asBoolean = (v: unknown): boolean | undefined =>
  typeof v === "boolean" ? v : undefined;

export const asArray = (v: unknown): readonly unknown[] => (Array.isArray(v) ? v : []);
