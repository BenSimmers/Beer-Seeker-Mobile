import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import {
  BIO_MAX,
  bioError,
  displayNameError,
  normalizeBio,
  normalizeDisplayName,
} from "../../../convex/lib/username";
import { errorMessage } from "../../backend";
import {
  Avatar,
  BackButton,
  ErrorBanner,
  Field,
  PageTitle,
  PrimaryButton,
} from "../../components/ui";
import { useToast } from "../../components/Toast";
import { useTheme } from "../../theme";
import { useStyles } from "./styles";
import { useAvatarUpload } from "./useAvatarUpload";

type Profile = Doc<"profiles"> & { avatarUrl: string | null };

/** Saves on its own, straight away, separate from the form's Save button. */
const PhotoPicker: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { pick, remove, busy } = useAvatarUpload();

  return (
    <View style={styles.photoRow}>
      <Pressable
        onPress={pick}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={profile.avatarUrl ? "Change profile photo" : "Add a profile photo"}
        accessibilityState={{ busy }}
      >
        <Avatar name={profile.displayName} uri={profile.avatarUrl} size={88} />
        {busy && (
          <View style={styles.photoBusy}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </Pressable>
      <View style={styles.photoActions}>
        <Pressable onPress={pick} disabled={busy} hitSlop={6} accessibilityRole="button">
          <Text style={styles.photoAction}>{profile.avatarUrl ? "Change photo" : "Add photo"}</Text>
        </Pressable>
        {profile.avatarUrl && (
          <Pressable onPress={remove} disabled={busy} hitSlop={6} accessibilityRole="button">
            <Text style={[styles.photoAction, styles.photoActionMuted]}>Remove</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const EditForm: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation();
  const toast = useToast();
  const update = useMutation(api.profiles.update);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [showFavourites, setShowFavourites] = useState(profile.showFavourites !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const name = normalizeDisplayName(displayName);
    const cleanBio = normalizeBio(bio);
    const invalid = displayNameError(name) ?? bioError(cleanBio);
    if (invalid) return setError(invalid);

    setBusy(true);
    setError(null);
    try {
      await update({ displayName: name, bio: cleanBio, showFavourites });
      toast.show("Profile saved.", "success");
      navigation.goBack();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save your profile. Try again."));
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      <PhotoPicker profile={profile} />
      <Field
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
      <Field
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Your local, your usual, your go-to karaoke song…"
        autoCapitalize="sentences"
        multiline
        maxLength={BIO_MAX}
        hint={`${bio.length}/${BIO_MAX}`}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>Show favourites to friends</Text>
          <Text style={styles.toggleHint}>
            Friends (people you follow who follow you back) can see the places you've starred.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Show favourites to friends"
          value={showFavourites}
          onValueChange={setShowFavourites}
          trackColor={{ false: colors.border, true: colors.primaryMuted }}
          thumbColor={showFavourites ? colors.primary : colors.muted}
        />
      </View>

      {error != null && <ErrorBanner message={error} />}

      <PrimaryButton title="Save" onPress={save} busy={busy} />
    </View>
  );
};

export const EditProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const profile = useQuery(api.profiles.me);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <BackButton label="Profile" />
      <PageTitle style={styles.pageTitle} title="Edit profile" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {profile ? <EditForm profile={profile} /> : <ActivityIndicator color={colors.primary} />}
      </ScrollView>
    </SafeAreaView>
  );
};
