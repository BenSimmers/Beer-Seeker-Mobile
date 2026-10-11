import { useMutation, useQuery } from "convex/react";
import React from "react";
import { View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { GroupInvite } from "../../../convex/groups";
import { useToast } from "../../components/Toast";
import { SectionLabel } from "../../components/ui";
import { FollowRequestCard, InboxCard } from "../../social";
import { makeStyles } from "../../theme";

const InviteCard: React.FC<{ invite: GroupInvite }> = ({ invite }) => {
  const toast = useToast();
  const respond = useMutation(api.groups.respond);
  const members = invite.memberCount;
  return (
    <InboxCard
      icon="people"
      accept={{ label: "Join", accessibilityLabel: `Join ${invite.name}` }}
      decline={{ accessibilityLabel: `Decline the invite to ${invite.name}` }}
      onAnswer={(accept) => respond({ groupId: invite.groupId, accept })}
      onAccepted={() => toast.show(`You've joined ${invite.name}.`, "success")}
    >
      <InboxCard.Strong>{invite.invitedBy}</InboxCard.Strong> invited you to{" "}
      <InboxCard.Strong>{invite.name}</InboxCard.Strong>
      {` · ${members} ${members === 1 ? "member" : "members"}`}
    </InboxCard>
  );
};

/** Follow requests and group invites waiting on you; nothing when there are none. */
export const Inbox: React.FC = () => {
  const styles = useStyles();
  const requests = useQuery(api.social.requests);
  const invites = useQuery(api.groups.invites);
  const count = (requests?.length ?? 0) + (invites?.length ?? 0);
  if (count === 0) return null;

  return (
    <View accessibilityLiveRegion="polite">
      <SectionLabel>Waiting on you · {count}</SectionLabel>
      <View style={styles.list}>
        {requests?.map((p) => (
          <FollowRequestCard key={p.userId} person={p} />
        ))}
        {invites?.map((i) => (
          <InviteCard key={i.groupId} invite={i} />
        ))}
      </View>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  list: {
    gap: 10,
  },
}));
