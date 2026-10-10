import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Group, GroupMember } from "../../../convex/groups";
import { useToast } from "../../components/Toast";
import { useAction } from "../../hooks/useAction";
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
import { DURATIONS } from "../../sharing";
import { useOpenProfile } from "../../navigation/useOpenProfile";
import { useStyles } from "./styles";

type Nav = NativeStackNavigationProp<FriendsStackParamList>;

const ShareWithGroup: React.FC<{ group: Group }> = ({ group }) => {
  const styles = useStyles();
  const toast = useToast();
  const share = useMutation(api.groups.shareWithGroup);
  const { run, busy } = useAction();

  const start = (minutes: number, label: string) =>
    run(async () => {
      const { shared, skipped } = await share({ groupId: group.groupId, minutes });
      const who = `${shared} ${shared === 1 ? "member" : "members"}`;
      toast.show(
        skipped > 0
          ? `Sharing with ${who} for ${label}. ${skipped} aren't your friends, so they won't see you.`
          : `Sharing with ${who} for ${label}.`,
        shared > 0 ? "success" : "warning",
      );
    }, "Couldn't start sharing. Check your connection.");

  return (
    <Card style={styles.shareCard}>
      <Text style={styles.shareText}>
        Share your location with everyone here who's your friend, while the app is open.
      </Text>
      <View style={styles.chips}>
        {DURATIONS.map((d) => (
          <Pressable
            key={d.minutes}
            style={styles.chip}
            disabled={busy}
            onPress={() => void start(d.minutes, d.label)}
            accessibilityRole="button"
            accessibilityLabel={`Share your location with ${group.name} for ${d.label}`}
          >
            <Text style={styles.chipText}>{d.label}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
};

const MemberRow: React.FC<{ group: Group; member: GroupMember }> = ({ group, member }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const openProfile = useOpenProfile();
  const removeMember = useMutation(api.groups.removeMember);
  const { run, busy } = useAction();
  const badge = member.isOwner
    ? "Creator"
    : member.status === "invited"
      ? "Invited"
      : member.isYou
        ? "You"
        : null;

  const remove = () =>
    Alert.alert(
      member.status === "invited" ? "Cancel invite?" : `Remove ${member.displayName}?`,
      member.status === "invited"
        ? `${member.displayName} won't be able to join ${group.name}.`
        : `They'll leave ${group.name}. You can invite them again later.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            void run(
              () => removeMember({ groupId: group.groupId, userId: member.userId }),
              "Couldn't remove them. Check your connection.",
            ),
        },
      ],
    );

  return (
    <Card style={[styles.memberRow, member.status === "invited" && styles.memberInvited]}>
      <Pressable
        style={styles.memberWho}
        onPress={() => openProfile(member.userId)}
        accessibilityRole="button"
        accessibilityLabel={`${member.displayName}, @${member.username}${badge ? `, ${badge}` : ""}`}
        accessibilityHint="Opens their profile"
      >
        <Avatar name={member.displayName} uri={member.avatarUrl} />
        <View style={styles.memberText}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.displayName}
          </Text>
          <Text style={styles.memberMeta} numberOfLines={1}>
            @{member.username}
            {badge ? ` · ${badge}` : ""}
          </Text>
        </View>
      </Pressable>
      {group.youOwn && !member.isYou && (
        <Pressable
          onPress={remove}
          disabled={busy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${member.displayName} from ${group.name}`}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
          )}
        </Pressable>
      )}
    </Card>
  );
};

const RenameGroup: React.FC<{ group: Group }> = ({ group }) => {
  const styles = useStyles();
  const toast = useToast();
  const rename = useMutation(api.groups.rename);
  const [name, setName] = useState(group.name);
  const { run, busy } = useAction();
  const changed = name.trim() !== group.name && name.trim() !== "";

  return (
    <View style={styles.rename}>
      <Field label="Group name" value={name} onChangeText={setName} autoCapitalize="words" />
      {changed && (
        <PrimaryButton
          title="Save name"
          busy={busy}
          onPress={() =>
            void run(async () => {
              await rename({ groupId: group.groupId, name });
              toast.show("Renamed.", "success");
            }, "Couldn't rename the group. Check your connection.")
          }
        />
      )}
    </View>
  );
};

export const GroupScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<FriendsStackParamList, "Group">>();
  const group = useQuery(api.groups.get, { groupId: params.groupId });
  const leave = useMutation(api.groups.leave);
  const removeGroup = useMutation(api.groups.remove);
  const { run, busy } = useAction();

  if (group === undefined) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <BackButton label="Friends" />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  if (group === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <BackButton label="Friends" />
        <MutedText style={styles.gone}>You're no longer in this group.</MutedText>
      </SafeAreaView>
    );
  }

  const members = group.members.filter((m) => m.status === "member").length;
  const invited = group.members.length - members;

  const confirm = (
    title: string,
    message: string,
    verb: string,
    done: string,
    action: () => Promise<unknown>,
  ) =>
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: verb,
        style: "destructive",
        onPress: async () => {
          if (!(await run(action, "Couldn't update the group. Check your connection."))) return;
          toast.show(done, "success");
          navigation.goBack();
        },
      },
    ]);

  const leaveGroup = () =>
    confirm(
      `Leave ${group.name}?`,
      group.youOwn
        ? "The longest-standing member will take over running it. Location sharing you've started carries on until it runs out."
        : "You'll need a new invite to rejoin. Location sharing you've started carries on until it runs out.",
      "Leave",
      `Left ${group.name}.`,
      () => leave({ groupId: group.groupId }),
    );

  const deleteGroup = () =>
    confirm(
      `Delete ${group.name}?`,
      "It's removed for everyone. Location sharing carries on until it runs out.",
      "Delete",
      `Deleted ${group.name}.`,
      () => removeGroup({ groupId: group.groupId }),
    );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <BackButton label="Friends" />
      <PageTitle
        style={styles.pageTitle}
        title={group.name}
        subtitle={`${members} ${members === 1 ? "member" : "members"}${invited > 0 ? ` · ${invited} invited` : ""}`}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ShareWithGroup group={group} />

        <SectionLabel style={styles.sectionLabel}>People</SectionLabel>
        {group.members.map((m) => (
          <MemberRow key={m.userId} group={group} member={m} />
        ))}
        {group.youOwn && (
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.push("PickGroupMembers", { groupId: group.groupId })}
            accessibilityRole="button"
          >
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={styles.addButtonText}>Add friends</Text>
          </Pressable>
        )}

        {group.youOwn && <RenameGroup key={group.name} group={group} />}

        <View style={styles.footer}>
          <Pressable
            style={styles.footerLink}
            onPress={leaveGroup}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.footerLinkText}>Leave group</Text>
          </Pressable>
          {group.youOwn && (
            <Pressable
              style={styles.footerLink}
              onPress={deleteGroup}
              disabled={busy}
              accessibilityRole="button"
            >
              <Text style={styles.footerLinkText}>Delete group</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
