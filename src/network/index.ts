import * as Network from "expo-network";
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

const RECHECK_MS = 4_000;

const isConnected = (state: Network.NetworkState): boolean => state.isConnected !== false;

let connected = true;
const listeners = new Set<() => void>();

const setConnected = (next: boolean): void => {
  if (next === connected) return;
  connected = next;
  for (const notify of listeners) notify();
};

const recheck = async (): Promise<boolean> => {
  try {
    setConnected(isConnected(await Network.getNetworkStateAsync()));
  } catch {
    // Unreadable state: keep whatever we last knew.
  }
  return connected;
};

let stopWatching: (() => void) | null = null;

const startWatching = (): void => {
  const network = Network.addNetworkStateListener((state) => setConnected(isConnected(state)));
  const appState = AppState.addEventListener("change", (state) => {
    if (state === "active") void recheck();
  });
  const timer = setInterval(() => {
    if (!connected) void recheck();
  }, RECHECK_MS);
  void recheck();

  stopWatching = () => {
    network.remove();
    appState.remove();
    clearInterval(timer);
  };
};

const subscribe = (notify: () => void): (() => void) => {
  listeners.add(notify);
  if (listeners.size === 1) startWatching();
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0) {
      stopWatching?.();
      stopWatching = null;
    }
  };
};

const getSnapshot = (): boolean => connected;
const getServerSnapshot = (): boolean => true;

export const useOnline = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const isOffline = async (): Promise<boolean> => !(await recheck());
