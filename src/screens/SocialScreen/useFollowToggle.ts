import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { errorMessage } from "../../backend";
import { useToast } from "../../components/Toast";

type Relation = { youFollow: boolean; followsYou: boolean };

export const followLabel = ({ youFollow, followsYou }: Relation): string => {
  if (youFollow && followsYou) return "Friends";
  if (youFollow) return "Following";
  return followsYou ? "Follow back" : "Follow";
};

export const useFollowToggle = (userId: Id<"users">, youFollow: boolean) => {
  const toast = useToast();
  const follow = useMutation(api.social.follow);
  const unfollow = useMutation(api.social.unfollow);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      await (youFollow ? unfollow : follow)({ userId });
    } catch (err) {
      toast.show(errorMessage(err, "Couldn't update that. Check your connection."), "error");
    } finally {
      setBusy(false);
    }
  };

  return { toggle, busy };
};
