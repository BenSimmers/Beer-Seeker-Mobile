import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { errorMessage } from "../../backend";
import { useToast } from "../../components/Toast";
import {
  Avatar,
  BackButton,
  Card,
  Field,
  MutedText,
  PageTitle,
  PrimaryButton,
  SectionLabel,
} from "../../components/ui";
import type { FriendsStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme";
import { useStyles } from "./styles";

/** Creates a group, or with a `groupId`, invites more friends to it. */
export const PickGroupMembersScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<FriendsStackParamList>>();
  const { params } = useRoute<RouteProp<FriendsStackParamList, "PickGroupMembers">>();
  const groupId = params?.groupId;
  const network = useQuery(api.social.network);
  const group = useQuery(api.groups.get, groupId ? { groupId } : "skip");
  const create = useMutation(api.groups.create);
  const invite = useMutation(api.groups.invite);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Set<Id<"users">>>(new Set());
  const [busy, setBusy] = useState(false);

  const already = new Set(group?.members.map((m) => m.userId));
  const friends = network?.friends.filter((f) => !already.has(f.userId));
  const ready = picked.size > 0 && (groupId !== undefined || name.trim() !== "");

  const toggle = (userId: Id<"users">) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const submit = async () => {
    setBusy(true);
    try {
      const memberIds = [...picked];
      if (groupId) {
        await invite({ groupId, userIds: memberIds });
        toast.show(`Invited ${memberIds.length}.`, "success");
        navigation.goBack();
      } else {
        const created = await create({ name, memberIds });
        toast.show("Group created. Friends will see your invite.", "success");
        navigation.replace("Group", { groupId: created });
      }
    } catch (err) {
      toast.show(errorMessage(err, "Couldn't save the group. Check your connection."), "error");
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <BackButton label={group ? group.name : "Friends"} />
      <PageTitle
        style={styles.pageTitle}
        title={groupId ? "Add friends" : "New group"}
        subtitle={groupId ? group?.name : undefined}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!groupId && (
          <View style={styles.nameField}>
            <Field
              label="Group name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Friday drinks"
              autoCapitalize="words"
              maxLength={40}
            />
          </View>
        )}
        <Text style={styles.intro}>
          They'll get an invite and join once they accept. Everyone in the group can see who's in
          it.
        </Text>

        <SectionLabel>Your friends{picked.size > 0 ? ` · ${picked.size} picked` : ""}</SectionLabel>
        {friends === undefined ? (
          <MutedText style={styles.gone}>Loading…</MutedText>
        ) : friends.length === 0 ? (
          <MutedText style={styles.gone}>
            {groupId
              ? "All your friends are already in."
              : "Groups are made of friends. Follow someone who follows you back first."}
          </MutedText>
        ) : (
          friends.map((f) => {
            const checked = picked.has(f.userId);
            return (
              <Card
                key={f.userId}
                style={styles.pickRow}
                selected={checked}
                onPress={() => toggle(f.userId)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={`${f.displayName}, @${f.username}`}
              >
                <Avatar name={f.displayName} uri={f.avatarUrl} />
                <View style={styles.pickName}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {f.displayName}
                  </Text>
                  <Text style={styles.memberMeta} numberOfLines={1}>
                    @{f.username}
                  </Text>
                </View>
                <Ionicons
                  name={checked ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={checked ? colors.primary : colors.muted}
                />
              </Card>
            );
          })
        )}
      </ScrollView>
      <View style={styles.submit}>
        <PrimaryButton
          title={groupId ? "Send invites" : "Create group"}
          onPress={() => void submit()}
          busy={busy}
          disabled={!ready}
        />
      </View>
    </SafeAreaView>
  );
};
