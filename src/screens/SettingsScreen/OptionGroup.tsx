import React from "react";
import { View } from "react-native";
import { makeStyles } from "../../theme";
import { SettingRow } from "./SettingRow";

export type Option<T> = {
  value: T;
  title: string;
  description: string;
  glyph: React.ReactNode;
};

type Props<T> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  noun: string;
};

export const OptionGroup = <T extends string>({ options, value, onChange, noun }: Props<T>) => {
  const styles = useStyles();

  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      {options.map((option) => (
        <SettingRow
          key={option.value}
          glyph={option.glyph}
          title={option.title}
          description={option.description}
          trailing="check"
          selected={value === option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === option.value }}
          accessibilityLabel={`${option.title} ${noun}`}
        />
      ))}
    </View>
  );
};

const useStyles = makeStyles(() => ({
  group: {
    gap: 10,
  },
}));
