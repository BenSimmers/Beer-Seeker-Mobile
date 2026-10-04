// Shared by the Convex functions and the app so both reject the same input.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const DISPLAY_NAME_MAX = 40;

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/** Handles are case-insensitive; a leading "@" is how people type them. */
export const normalizeUsername = (raw: string): string =>
  raw.trim().replace(/^@/, "").toLowerCase();

/** Expects a normalized username. Returns null when it is acceptable. */
export const usernameError = (username: string): string | null => {
  if (username.length < USERNAME_MIN) {
    return `Usernames need at least ${USERNAME_MIN} characters.`;
  }
  if (username.length > USERNAME_MAX) {
    return `Usernames can be at most ${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Use only letters, numbers and underscores.";
  }
  return null;
};

export const normalizeDisplayName = (raw: string): string => raw.trim().replace(/\s+/g, " ");

/** Expects a normalized display name. Returns null when it is acceptable. */
export const displayNameError = (displayName: string): string | null => {
  if (displayName.length === 0) return "Add a display name.";
  if (displayName.length > DISPLAY_NAME_MAX) {
    return `Display names can be at most ${DISPLAY_NAME_MAX} characters.`;
  }
  return null;
};
