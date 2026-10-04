import { useRoute, type RouteProp } from "@react-navigation/native";
import { useQuery } from "convex/react";
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { ConnectionKind } from "../../../convex/social";
import { BackButton, MutedText, PageTitle } from "../../components/ui";
import type { FriendsStackParamList } from "../../navigation/types";
import { PersonRow } from "../SocialScreen/PersonRow";
import { useOpenProfile } from "../SocialScreen/useOpenProfile";
import { useStyles } from "./styles";

const TITLES: Record<ConnectionKind, string> = {
  friends: "Friends",
  following: "Following",
  followers: "Followers",
};

const EMPTY: Record<ConnectionKind, (name: string) => string> = {
  friends: (name) => `${name} hasn't got any friends on here yet.`,
  following: (name) => `${name} isn't following anyone yet.`,
  followers: (name) => `Nobody follows ${name} yet.`,
};

export const ConnectionsScreen: React.FC = () => {
  const styles = useStyles();
  const { params } = useRoute<RouteProp<FriendsStackParamList, "Connections">>();
  const people = useQuery(api.social.connections, { userId: params.userId, kind: params.kind });
  const openProfile = useOpenProfile();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <BackButton label={params.name} />
      <PageTitle style={styles.pageTitle} title={TITLES[params.kind]} subtitle={params.name} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {people === undefined ? (
          <MutedText>Loading…</MutedText>
        ) : people.length === 0 ? (
          <MutedText>{EMPTY[params.kind](params.name)}</MutedText>
        ) : (
          people.map((p) => (
            <PersonRow key={p.userId} person={p} onPress={() => openProfile(p.userId)} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
