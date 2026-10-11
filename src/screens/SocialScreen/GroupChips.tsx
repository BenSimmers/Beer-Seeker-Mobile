import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Group } from "../../../convex/groups";
import { fonts, makeStyles, useTheme } from "../../theme";

type Props = {
  groups: Group[];
  /** Null means everyone. */
  selected: Id<"groups"> | null;
  onSelect: (groupId: Id<"groups"> | null) => void;
  onNew: () => void;
};

/** "All friends", each of your groups, and a way to start one. */
export const GroupChips: React.FC<Props> = ({ groups, selected, onSelect, onNew }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const chip = (key: string, label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel="Filter by group"
    >
      {chip("all", "All friends", selected === null, () => onSelect(null))}
      {groups.map((g) =>
        chip(g.groupId, g.name, g.groupId === selected, () =>
          onSelect(g.groupId === selected ? null : g.groupId),
        ),
      )}
      <Pressable
        style={[styles.chip, styles.chipNew]}
        onPress={onNew}
        accessibilityRole="button"
        accessibilityLabel="New group"
      >
        <Ionicons name="add" size={14} color={colors.muted} />
        <Text style={styles.chipNewText}>New group</Text>
      </Pressable>
    </ScrollView>
  );
};

const useStyles = makeStyles((colors) => ({
  row: {
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    maxWidth: 180,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.body,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  chipTextActive: {
    color: colors.background,
  },
  chipNew: {
    borderStyle: "dashed",
  },
  chipNewText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 0.4,
  },
}));
