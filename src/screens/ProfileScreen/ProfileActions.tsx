import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Platform, Pressable, Text } from "react-native";
import type { Id } from "../../../convex/_generated/dataModel";
import { BottomSheet } from "../../components/ui";
import { fonts, makeStyles, useTheme } from "../../theme";
import { ReportSheet } from "./ReportSheet";
import { useBlock } from "../../social";

type Props = {
  userId: Id<"users">;
  username: string;
  displayName: string;
  youBlocked: boolean;
};

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  destructive?: boolean;
  run: () => void;
};

/** The "⋯" menu on someone else's profile: block or unblock, and report. */
export const ProfileActions: React.FC<Props> = ({ userId, username, displayName, youBlocked }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { block, unblock, busy } = useBlock(userId, displayName);
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  // iOS can't present an alert or another modal while this one is still
  // animating away, so the chosen action waits for it to finish closing.
  const pending = useRef<(() => void) | null>(null);

  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const choose = (action: () => void) => {
    pending.current = action;
    setOpen(false);
    // onDismiss is iOS-only; elsewhere nothing stops it running straight away.
    if (Platform.OS !== "ios") runPending();
  };

  const actions: Action[] = [
    youBlocked
      ? { icon: "ban-outline", label: `Unblock @${username}`, run: () => void unblock() }
      : { icon: "ban-outline", label: `Block @${username}`, destructive: true, run: block },
    {
      icon: "flag-outline",
      label: `Report @${username}`,
      destructive: true,
      run: () => setReporting(true),
    },
  ];

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        disabled={busy}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${displayName}`}
      >
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.primary} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} onDismiss={runPending}>
        {actions.map((a) => {
          const tint = a.destructive ? colors.danger : colors.headline;
          return (
            <Pressable
              key={a.label}
              style={styles.option}
              onPress={() => choose(a.run)}
              accessibilityRole="button"
            >
              <Ionicons name={a.icon} size={20} color={tint} />
              <Text style={[styles.optionText, { color: tint }]}>{a.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.option, styles.cancel]}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </BottomSheet>

      <ReportSheet
        visible={reporting}
        onClose={() => setReporting(false)}
        userId={userId}
        displayName={displayName}
      />
    </>
  );
};

const useStyles = makeStyles((colors) => ({
  trigger: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  optionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
  },
  cancel: {
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  cancelText: {
    color: colors.muted,
    fontFamily: fonts.labelBold,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
}));
