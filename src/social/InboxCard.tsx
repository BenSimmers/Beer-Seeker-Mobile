import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Card } from "../components/ui";
import { useAction } from "../hooks/useAction";
import { fonts, makeStyles, useTheme } from "../theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  /** Who's asking and for what; wrap names in <InboxCard.Strong>. */
  children: React.ReactNode;
  accept: { label: string; accessibilityLabel: string };
  decline: { accessibilityLabel: string };
  /** Answers it; true accepts. Resolves once the server has it. */
  onAnswer: (accept: boolean) => Promise<unknown>;
  onAccepted?: () => void;
};

/** Something waiting on the user — a follow request or group invite — with yes/no buttons. */
export const InboxCard = ({ icon, children, accept, decline, onAnswer, onAccepted }: Props) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { run, busy } = useAction();

  const answer = async (yes: boolean) => {
    const ok = await run(() => onAnswer(yes), "Couldn't answer that. Check your connection.");
    if (ok && yes) onAccepted?.();
  };

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.text}>{children}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.buttonFilled]}
          disabled={busy}
          onPress={() => void answer(true)}
          accessibilityRole="button"
          accessibilityLabel={accept.accessibilityLabel}
        >
          <Text style={[styles.buttonText, styles.buttonTextFilled]}>{accept.label}</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          disabled={busy}
          onPress={() => void answer(false)}
          accessibilityRole="button"
          accessibilityLabel={decline.accessibilityLabel}
        >
          <Text style={styles.buttonText}>Decline</Text>
        </Pressable>
      </View>
    </Card>
  );
};

const Strong: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles();
  return <Text style={styles.strong}>{children}</Text>;
};
InboxCard.Strong = Strong;

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
    borderColor: colors.primary,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    flex: 1,
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  strong: {
    color: colors.headline,
    fontFamily: fonts.bodyMedium,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFilled: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  buttonTextFilled: {
    color: colors.background,
  },
}));
