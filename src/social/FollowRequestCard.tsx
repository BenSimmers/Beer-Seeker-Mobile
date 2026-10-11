import { useMutation } from "convex/react";
import React from "react";
import { api } from "../../convex/_generated/api";
import type { Person } from "../../convex/social";
import { useToast } from "../components/Toast";
import { InboxCard } from "./InboxCard";

export const FollowRequestCard: React.FC<{
  person: Pick<Person, "userId" | "displayName" | "username">;
}> = ({ person }) => {
  const toast = useToast();
  const respond = useMutation(api.social.respond);
  return (
    <InboxCard
      icon="person-add"
      accept={{ label: "Accept", accessibilityLabel: `Let ${person.displayName} follow you` }}
      decline={{ accessibilityLabel: `Decline ${person.displayName}'s request` }}
      onAnswer={(accept) => respond({ userId: person.userId, accept })}
      onAccepted={() => toast.show(`${person.displayName} now follows you.`, "success")}
    >
      <InboxCard.Strong>{person.displayName}</InboxCard.Strong> (@{person.username}) wants to follow
      you
    </InboxCard>
  );
};
