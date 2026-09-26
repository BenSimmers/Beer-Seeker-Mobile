import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { fonts, makeStyles } from "../../theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

export const Eyebrow: React.FC<Props> = ({ children, style }) => {
  const styles = useStyles();
  return (
    <Text style={[styles.eyebrow, style]} accessibilityRole="header">
      {children}
    </Text>
  );
};

const useStyles = makeStyles((colors) => ({
  eyebrow: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
}));
