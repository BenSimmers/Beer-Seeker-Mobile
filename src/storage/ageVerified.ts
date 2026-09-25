import { onboardingLogger as log } from "../logger";
import { typedStore } from "./typedStore";

const AGE_VERIFIED_KEY = "age_verified_v1";

/**
 * Stored as the bare string "true" rather than JSON, which is what shipped
 * builds already wrote — changing the format would send verified users back
 * through the gate.
 */
export const ageVerifiedStore = typedStore<boolean>({
  key: AGE_VERIFIED_KEY,
  decode: (raw) => raw === "true",
  encode: (value) => (value ? "true" : "false"),
  fallback: false,
  log,
});
