import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { REPORT_DETAILS_MAX, type ReportReason } from "../../../convex/lib/reports";
import { useToast } from "../../components/Toast";
import { useAction } from "../../hooks/useAction";
import { fonts, makeStyles, useTheme } from "../../theme";
import { BottomSheet, Field, PrimaryButton } from "../../components/ui";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or a scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate name, bio or photo" },
  { value: "impersonation", label: "Pretending to be someone else" },
  { value: "other", label: "Something else" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: Id<"users">;
  displayName: string;
};

export const ReportSheet: React.FC<Props> = ({ visible, onClose, userId, displayName }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const report = useMutation(api.reports.report);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const { run, busy } = useAction();

  const close = () => {
    setReason(null);
    setDetails("");
    onClose();
  };

  const submit = async () => {
    if (!reason) return;
    const sent = await run(
      () => report({ userId, reason, details: details.trim() || undefined }),
      "Couldn't send your report. Check your connection.",
    );
    if (!sent) return;
    toast.show(`Thanks. We'll review ${displayName}'s account.`, "success");
    close();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={`Report ${displayName}`}>
      <Text style={styles.intro}>They won't know you reported them. What's the problem?</Text>

      <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
        <View accessibilityRole="radiogroup">
          {REASONS.map((r) => {
            const checked = reason === r.value;
            return (
              <Pressable
                key={r.value}
                style={styles.option}
                onPress={() => setReason(r.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
              >
                <Ionicons
                  name={checked ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={checked ? colors.primary : colors.muted}
                />
                <Text style={styles.optionText}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.details}>
          <Field
            label="Details (optional)"
            value={details}
            onChangeText={setDetails}
            placeholder="Anything that helps us understand"
            autoCapitalize="sentences"
            multiline
            maxLength={REPORT_DETAILS_MAX}
          />
        </View>

        <PrimaryButton
          title="Send report"
          onPress={() => void submit()}
          busy={busy}
          disabled={!reason}
        />
      </ScrollView>
    </BottomSheet>
  );
};

const useStyles = makeStyles((colors) => ({
  intro: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  optionText: {
    flex: 1,
    color: colors.headline,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  details: {
    marginTop: 12,
    marginBottom: 8,
  },
}));
