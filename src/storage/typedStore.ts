import AsyncStorage from "@react-native-async-storage/async-storage";

type Log = { warn: (...args: unknown[]) => void };

type StoreSpec<T> = {
  key: string;
  /**
   * null for anything that does not survive parsing — the reader gets `fallback` instead.
   */
  decode: (raw: string) => T | null;
  encode: (value: T) => string;
  fallback: T;
  log: Log;
};

export type TypedStore<T> = {
  read: () => Promise<T>;
  write: (value: T) => Promise<void>;
  clear: () => Promise<void>;
};

/**
 * One key of AsyncStorage, typed. Nothing here throws: a missing, corrupt or
 * unreadable value reads as `fallback`, and a failed write is logged and dropped.
 * Persistence is never worth taking the app down for.
 */
export const typedStore = <T>({
  key,
  decode,
  encode,
  fallback,
  log,
}: StoreSpec<T>): TypedStore<T> => ({
  read: async () => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return fallback;
      return decode(raw) ?? fallback;
    } catch (e) {
      log.warn(`failed to read ${key}`, e);
      return fallback;
    }
  },

  write: async (value) => {
    try {
      await AsyncStorage.setItem(key, encode(value));
    } catch (e) {
      log.warn(`failed to persist ${key}`, e);
    }
  },

  clear: async () => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      log.warn(`failed to clear ${key}`, e);
    }
  },
});

type JsonStoreSpec<T> = Omit<StoreSpec<T>, "decode" | "encode"> & {
  parse: (value: unknown) => T | null;
};

/** The usual case: JSON on disk, validated on the way back in. */
export const jsonStore = <T>({ parse, ...spec }: JsonStoreSpec<T>): TypedStore<T> =>
  typedStore({
    ...spec,
    decode: (raw) => parse(JSON.parse(raw)),
    encode: (value) => JSON.stringify(value),
  });
