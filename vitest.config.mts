import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    // Injected by the Metro/Expo bundler at runtime; src/logger.ts reads it.
    __DEV__: false,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
