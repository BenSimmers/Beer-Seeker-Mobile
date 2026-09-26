import React from "react";
import { Text, View, type PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui";
import { fonts, makeStyles, useTheme } from "../../theme";

type Props = Pick<
  PressableProps,
  "accessibilityRole" | "accessibilityState" | "accessibilityLabel"
> & {
  glyph: React.ReactNode;
  title: string;
  description: string;
  trailing: "check" | "chevron";
  selected?: boolean;
  onPress: () => void;
};

export const SettingRow: React.FC<Props> = ({
  glyph,
  title,
  description,
  trailing,
  selected = false,
  onPress,
  ...a11y
}) => {
  const { colors } = useTheme();
  const styles = useSettingRowStyles();

  return (
    <Card selected={selected} onPress={onPress} {...a11y}>
      {glyph}

      <View style={styles.text}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {trailing === "check" ? (
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected && <Ionicons name="checkmark" size={14} color={colors.background} />}
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      )}
    </Card>
  );
};

export const useSettingRowStyles = makeStyles((colors) => ({
  text: {
    flex: 1,
  },
  title: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 16,
  },
  titleSelected: {
    color: colors.primary,
  },
  description: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
}));
