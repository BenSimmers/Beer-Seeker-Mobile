import { ConvexAuthProvider, type TokenStorage } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexError } from "convex/values";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Platform } from "react-native";

// Inlined at build time by Expo; `npx convex dev` writes it to .env.local.
// Left unset, the app still runs — only the Friends tab needs a backend.
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

export const backendConfigured = CONVEX_URL.length > 0;

const convex = backendConfigured
  ? new ConvexReactClient(CONVEX_URL, { unsavedChangesWarning: false })
  : null;

// Session tokens go in the keychain / keystore. SecureStore has no web
// implementation, so web falls back to Convex Auth's localStorage default.
const secureStorage: TokenStorage | undefined =
  Platform.OS === "web"
    ? undefined
    : {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      };

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  convex ? (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      {children}
    </ConvexAuthProvider>
  ) : (
    <>{children}</>
  );

/** The message a Convex function threw on purpose, or `fallback` for anything else. */
export const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof ConvexError && typeof err.data === "string" ? err.data : fallback;
