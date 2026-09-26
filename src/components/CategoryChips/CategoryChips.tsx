import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CATEGORY_FILTERS, CATEGORY_FILTER_LABELS } from "../../types";
import type { CategoryFilter } from "../../types";
import { useStyles } from "./styles";

type Props = {
  value: CategoryFilter | null;
  onChange: (filter: CategoryFilter) => void;
  counts?: Partial<Record<CategoryFilter, number>>;
  contentPadding?: number;
  scrollable?: boolean;
};

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
