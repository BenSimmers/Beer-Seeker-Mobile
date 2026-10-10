import { useQuery } from "convex/react";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { BlockedPerson } from "../../../convex/blocks";
import { Avatar, BackButton, Card, MutedText, PageTitle } from "../../components/ui";
import { useTheme } from "../../theme";
import { useBlock } from "../../social";
import { useStyles } from "./styles";

const BlockedRow: React.FC<{ person: BlockedPerson }> = ({ person }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { unblock, busy } = useBlock(person.userId, person.displayName);

  return (
    <Card style={styles.row}>
      <Avatar name={person.displayName} uri={person.avatarUrl} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {person.displayName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          @{person.username}
        </Text>
      </View>
      <Pressable
        style={styles.unblock}
        onPress={() => void unblock()}
        disabled={busy}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Unblock ${person.displayName}`}
        accessibilityState={{ busy }}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.unblockText}>Unblock</Text>
        )}
      </Pressable>
    </Card>
  );
};

export const BlockedScreen: React.FC = () => {
  const styles = useStyles();
  const blocked = useQuery(api.blocks.list);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <BackButton label="Back" />
      <PageTitle
        style={styles.pageTitle}
        title="Blocked accounts"
        subtitle="They can't find your profile or follow you, and they aren't told."
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {blocked === undefined ? (
          <MutedText>Loading…</MutedText>
        ) : blocked.length === 0 ? (
          <MutedText>You haven't blocked anyone.</MutedText>
        ) : (
          blocked.map((p) => <BlockedRow key={p.userId} person={p} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
