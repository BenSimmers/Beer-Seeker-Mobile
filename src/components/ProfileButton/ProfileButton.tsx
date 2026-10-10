import { useConvexAuth, useQuery } from "convex/react";
import React from "react";
import { Pressable } from "react-native";
import { api } from "../../../convex/_generated/api";
import { backendConfigured } from "../../backend";
import { useOpenProfile } from "../../navigation/useOpenProfile";
import { makeStyles } from "../../theme";
import { Avatar } from "../ui";

const SIZE = 32;

const SignedInButton: React.FC = () => {
  const styles = useStyles();
  const openProfile = useOpenProfile();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");

  if (!profile) return null;

  return (
    <Pressable
      style={styles.button}
      onPress={() => openProfile(profile.userId)}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Your profile"
    >
      <Avatar name={profile.displayName} uri={profile.avatarUrl} size={SIZE} />
    </Pressable>
  );
};

export const ProfileButton: React.FC = () => (backendConfigured ? <SignedInButton /> : null);

const useStyles = makeStyles(() => ({
  button: {
    borderRadius: SIZE / 2,
  },
}));
