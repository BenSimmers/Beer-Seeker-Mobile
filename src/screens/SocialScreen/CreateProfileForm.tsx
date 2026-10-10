import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import {
  USERNAME_MAX,
  USERNAME_MIN,
  displayNameError,
  normalizeDisplayName,
  normalizeUsername,
  usernameError,
} from "../../../convex/lib/username";
import { errorMessage } from "../../backend";
import { ErrorBanner, Field, PrimaryButton } from "../../components/ui";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { useStyles } from "./styles";

/** Second step of sign-up: an account exists, but nobody can find it yet. */
export const CreateProfileForm: React.FC = () => {
  const styles = useStyles();
  const { signOut } = useAuthActions();
  const createProfile = useMutation(api.profiles.create);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const handle = normalizeUsername(username);
    const name = normalizeDisplayName(displayName);
    const invalid = usernameError(handle) ?? displayNameError(name);
    if (invalid) return setError(invalid);

    setBusy(true);
    setError(null);
    try {
      await createProfile({ username: handle, displayName: name });
    } catch (err) {
      setError(errorMessage(err, "Couldn't save your profile. Try again."));
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.intro}>
        Pick a username so friends can find you. You can't change it later, so choose one you'll be
        happy with.
      </Text>

      <Field
        label="Username"
        value={username}
        onChangeText={setUsername}
        placeholder="beer_seeker"
        autoComplete="username-new"
        textContentType="username"
        hint={`${USERNAME_MIN}–${USERNAME_MAX} letters, numbers or underscores.`}
        returnKeyType="next"
      />
      <Field
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      {error != null && <ErrorBanner message={error} />}

      <PrimaryButton title="Save profile" onPress={submit} busy={busy} />

      <Pressable
        style={styles.switchFlow}
        onPress={() => void signOut()}
        accessibilityRole="button"
      >
        <Text style={styles.switchFlowText}>Sign out</Text>
      </Pressable>

      <DeleteAccountButton />
    </View>
  );
};
