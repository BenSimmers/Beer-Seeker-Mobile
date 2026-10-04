import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text } from "react-native";
import { api } from "../../../convex/_generated/api";
import { errorMessage } from "../../backend";
import { useToast } from "../../components/Toast";
import { fonts, makeStyles, useTheme } from "../../theme";

export const DeleteAccountButton: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { signOut } = useAuthActions();
  const deleteAccount = useMutation(api.account.deleteAccount);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await deleteAccount();
    } catch (err) {
      toast.show(errorMessage(err, "Couldn't delete your account. Try again."), "error");
      setBusy(false);
      return;
    }
    // The server side is gone; this clears the tokens left on the device.
    await signOut();
    toast.show("Your account has been deleted.", "success");
  };

  const confirm = () =>
    Alert.alert(
      "Delete account?",
      "This permanently removes your profile, who you follow and your followers. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void remove() },
      ],
    );

  return (
    <Pressable
      style={styles.button}
      onPress={confirm}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Delete account"
      accessibilityState={{ busy }}
    >
      {busy ? (
        <ActivityIndicator color={colors.danger} />
      ) : (
        <Text style={styles.text}>Delete account</Text>
      )}
    </Pressable>
  );
};

const useStyles = makeStyles((colors) => ({
  button: {
    alignSelf: "center",
    paddingVertical: 8,
    marginTop: 32,
  },
  text: {
    color: colors.danger,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 0.5,
  },
}));
