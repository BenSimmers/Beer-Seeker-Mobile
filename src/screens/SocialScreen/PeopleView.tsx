import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { Person } from "../../../convex/social";
import { errorMessage } from "../../backend";
import { useToast } from "../../components/Toast";
import { MutedText, PageTitle, SearchField, SectionLabel } from "../../components/ui";
import { useTheme } from "../../theme";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { FriendsMap } from "./FriendsMap";
import { Inbox } from "./Inbox";
import { PersonRow } from "../../social";
import { useStyles } from "./styles";
import { useOpenProfile } from "../../navigation/useOpenProfile";

const SEARCH_DEBOUNCE_MS = 250;

const useDebounced = (value: string, ms: number) => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
};

type SectionProps = {
  label: string;
  people: Person[];
  empty: string;
};

const PeopleSection: React.FC<SectionProps> = ({ label, people, empty }) => {
  const styles = useStyles();
  const openProfile = useOpenProfile();
  return (
    <View>
      <SectionLabel>
        {label}
        {people.length > 0 ? ` · ${people.length}` : ""}
      </SectionLabel>
      {people.length === 0 ? (
        <MutedText style={styles.emptyText}>{empty}</MutedText>
      ) : (
        people.map((p) => (
          <PersonRow key={p.userId} person={p} onPress={() => openProfile(p.userId)} />
        ))
      )}
    </View>
  );
};

type OwnProfile = Doc<"profiles"> & { avatarUrl: string | null };

const SharingBanner: React.FC<{ count: number }> = ({ count }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const stopAll = useMutation(api.location.stopAllSharing);

  const onStop = () =>
    stopAll().catch((err) =>
      toast.show(errorMessage(err, "Couldn't stop sharing. Check your connection."), "error"),
    );

  return (
    <View style={styles.sharingBanner} accessibilityLiveRegion="polite">
      <Ionicons name="radio" size={16} color={colors.primary} />
      <Text style={styles.sharingBannerText}>
        Sharing your location with {count} {count === 1 ? "friend" : "friends"} while the app is
        open
      </Text>
      <Pressable
        onPress={onStop}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Stop sharing your location with everyone"
      >
        <Text style={styles.sharingBannerAction}>Stop all</Text>
      </Pressable>
    </View>
  );
};

export const PeopleView: React.FC<{ profile: OwnProfile }> = ({ profile }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { signOut } = useAuthActions();
  const [query, setQuery] = useState("");
  const term = useDebounced(query.trim(), SEARCH_DEBOUNCE_MS);
  const searching = query.trim().length > 0;

  const network = useQuery(api.social.network);
  const shares = useQuery(api.location.shares);
  const sharingWith = shares?.outgoing.length ?? 0;
  const openProfile = useOpenProfile();
  const results = useQuery(api.social.search, searching && term ? { term } : "skip");

  const signOutButton = (
    <Pressable
      style={styles.signOut}
      onPress={() => void signOut()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Sign out"
    >
      <Ionicons name="log-out-outline" size={16} color={colors.muted} />
      <Text style={styles.signOutText}>Sign out</Text>
    </Pressable>
  );

  return (
    <>
      <PageTitle
        style={styles.pageTitle}
        title={profile.displayName}
        subtitle={`@${profile.username}`}
        accessory={signOutButton}
      />

      <SearchField
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
        placeholder="Find people by username…"
        returnKeyType="search"
      />

      {sharingWith > 0 && <SharingBanner count={sharingWith} />}

      {searching ? (
        results === undefined ? (
          <MutedText style={styles.emptyText}>Searching…</MutedText>
        ) : results.length === 0 ? (
          <MutedText style={styles.emptyText}>
            {term.length < 2 ? "Keep typing…" : `Nobody found for “${term}”.`}
          </MutedText>
        ) : (
          results.map((p) => (
            <PersonRow key={p.userId} person={p} onPress={() => openProfile(p.userId)} />
          ))
        )
      ) : network === undefined ? (
        <MutedText style={styles.emptyText}>Loading…</MutedText>
      ) : (
        <View style={styles.sections}>
          <Inbox />
          <View>
            <SectionLabel>
              Friends{network.friends.length > 0 ? ` · ${network.friends.length}` : ""}
            </SectionLabel>
            {network.friends.length === 0 ? (
              <MutedText style={styles.emptyText}>
                When you and someone follow each other, you're friends.
              </MutedText>
            ) : (
              <FriendsMap friends={network.friends} />
            )}
          </View>
          <PeopleSection
            label="Following"
            people={network.following}
            empty="Search for a username above to follow someone."
          />
          <PeopleSection label="Followers" people={network.followers} empty="No one yet." />
        </View>
      )}

      {!searching && <DeleteAccountButton />}
    </>
  );
};
