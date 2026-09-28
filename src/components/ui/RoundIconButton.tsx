import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles, useTheme } from "../../theme";

export const ROUND_ICON_BUTTON_SIZE = 32;

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
};

export const RoundIconButton: React.FC<Props> = ({ icon, onPress, accessibilityLabel }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={16} color={colors.primary} />
    </Pressable>
  );
};

const useStyles = makeStyles((colors) => ({
  button: {
    width: ROUND_ICON_BUTTON_SIZE,
    height: ROUND_ICON_BUTTON_SIZE,
    borderRadius: ROUND_ICON_BUTTON_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
}));
