import { useMutation } from "convex/react";
import { Alert } from "react-native";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToast } from "../components/Toast";
import { useAction } from "../hooks/useAction";

/** Block (after a confirm) and unblock one account, with toasts for the outcome. */
export const useBlock = (userId: Id<"users">, displayName: string) => {
  const toast = useToast();
  const blockMutation = useMutation(api.blocks.block);
  const unblockMutation = useMutation(api.blocks.unblock);
  const { run: runAction, busy } = useAction();

  const run = async (action: () => Promise<unknown>, done: string) => {
    if (await runAction(action, "Couldn't update blocking. Check your connection.")) {
      toast.show(done, "success");
    }
  };

  const block = () =>
    Alert.alert(
      `Block ${displayName}?`,
      "They won't be able to find your profile or follow you, and you'll both stop following each other. Any location sharing between you ends. They won't be told.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => void run(() => blockMutation({ userId }), `Blocked ${displayName}.`),
        },
      ],
    );

  const unblock = () => run(() => unblockMutation({ userId }), `Unblocked ${displayName}.`);

  return { block, unblock, busy };
};
