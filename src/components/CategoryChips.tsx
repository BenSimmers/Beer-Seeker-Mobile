import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CATEGORY_FILTERS, CATEGORY_FILTER_LABELS } from "../types";
import type { CategoryFilter } from "../types";
import { fonts, makeStyles } from "../theme";

type Props = {
  value: CategoryFilter;
  onChange: (filter: CategoryFilter) => void;
  counts?: Partial<Record<CategoryFilter, number>>;
  contentPadding?: number;
  scrollable?: boolean;
};

/** The horizontal category picker shared by Browse and Compass. */
export const CategoryChips: React.FC<Props> = ({
  value,
  onChange,
  counts,
  contentPadding = 20,
  scrollable = false,
}) => {
  const styles = useStyles();

  const chipRow = (
    <View
      style={[
        styles.chipRowOuter,
        scrollable && styles.chipRowScrollable,
        { paddingHorizontal: contentPadding },
      ]}
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
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {chipRow}
      </ScrollView>
    );
  }

  return chipRow;
};

const useStyles = makeStyles((colors) => ({
  chipRowOuter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  chipRowScrollable: {
    flexWrap: "nowrap",
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
