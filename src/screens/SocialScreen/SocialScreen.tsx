import { useConvexAuth, useQuery } from "convex/react";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { backendConfigured } from "../../backend";
import { Eyebrow, MutedText } from "../../components/ui";
import { useTheme } from "../../theme";
import { CreateProfileForm } from "./CreateProfileForm";
import { PeopleView } from "./PeopleView";
import { SignInForm } from "./SignInForm";
import { useStyles } from "./styles";

const Loading: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
};

/** Signed out → sign in; signed in without a username → pick one; else people. */
const AccountFlow: React.FC = () => {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <SignInForm />;
  if (profile === undefined) return <Loading />;
  if (profile === null) return <CreateProfileForm />;
  return <PeopleView profile={profile} />;
};

export const SocialScreen: React.FC = () => {
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Eyebrow style={styles.header}>Friends</Eyebrow>
        {backendConfigured ? (
          <AccountFlow />
        ) : (
          // Hooks above need ConvexAuthProvider, which is absent without a URL.
          <MutedText style={styles.emptyText}>
            Accounts aren't set up in this build. Set EXPO_PUBLIC_CONVEX_URL to enable them.
          </MutedText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
