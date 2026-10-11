import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Person } from "../../convex/social";
import { useToast } from "../components/Toast";
import { useAction } from "../hooks/useAction";

export type Relation = Pick<
  Person,
  "userId" | "displayName" | "youFollow" | "followsYou" | "requested"
>;

export const followLabel = ({ youFollow, followsYou, requested }: Relation): string => {
  if (youFollow && followsYou) return "Friends";
  if (youFollow) return "Following";
  if (requested) return "Requested";
  return followsYou ? "Follow back" : "Follow";
};

/** Follows (by request), or unfollows / withdraws a pending request. */
export const useFollowToggle = (person: Relation) => {
  const toast = useToast();
  const follow = useMutation(api.social.follow);
  const unfollow = useMutation(api.social.unfollow);
  const { run, busy } = useAction();
  const active = person.youFollow || person.requested;

  const toggle = async () => {
    const ok = await run(
      () => (active ? unfollow : follow)({ userId: person.userId }),
      "Couldn't update that. Check your connection.",
    );
    if (ok && !active) {
      toast.show(`Request sent. You'll follow ${person.displayName} once they accept.`, "success");
    }
  };

  return { toggle, busy, active };
};
