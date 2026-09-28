import React from "react";
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles } from "../../theme";

type Props = Pick<
  PressableProps,
  "onPress" | "accessibilityRole" | "accessibilityState" | "accessibilityLabel"
> & {
  children: React.ReactNode;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Card: React.FC<Props> = ({ children, selected = false, style, onPress, ...a11y }) => {
  const styles = useStyles();
  const cardStyle = [styles.card, selected && styles.selected, style];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }
  return (
    <Pressable style={cardStyle} onPress={onPress} {...a11y}>
      {children}
    </Pressable>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
}));
