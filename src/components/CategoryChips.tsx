import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { CATEGORY_FILTERS, CATEGORY_FILTER_LABELS } from "../types";
import type { CategoryFilter } from "../types";
import { fonts, makeStyles } from "../theme";

type Props = {
  value: CategoryFilter;
  onChange: (filter: CategoryFilter) => void;
  /** Nearby totals per filter, appended to each label. Omitted on the compass. */
  counts?: Partial<Record<CategoryFilter, number>>;
  /** Inset of the first and last chip; 0 when the parent already pads its content. */
  contentPadding?: number;
};

/** The horizontal category picker shared by Browse and Compass. */
export const CategoryChips: React.FC<Props> = ({
  value,
  onChange,
  counts,
  contentPadding = 20,
}) => {
  const styles = useStyles();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipRowOuter}
      contentContainerStyle={[styles.chipRow, { paddingHorizontal: contentPadding }]}
    >
      {CATEGORY_FILTERS.map((f) => (
        <Pressable
          key={f}
          onPress={() => onChange(f)}
          style={[styles.chip, value === f && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === f && styles.chipTextActive]} numberOfLines={1}>
            {CATEGORY_FILTER_LABELS[f]}
            {counts ? ` (${counts[f] ?? 0})` : ""}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const useStyles = makeStyles((colors) => ({
  chipRowOuter: {
    // Centred parents (the compass) would otherwise shrink the row to its content.
    alignSelf: "stretch",
    flexGrow: 0,
    height: 48,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    height: 32,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  chipActive: {
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.muted,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipTextActive: {
    color: colors.primary,
  },
}));
