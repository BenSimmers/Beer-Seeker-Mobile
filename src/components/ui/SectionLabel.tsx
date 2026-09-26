import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { fonts, makeStyles } from "../../theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

export const SectionLabel: React.FC<Props> = ({ children, style }) => {
  const styles = useStyles();
  return <Text style={[styles.label, style]}>{children}</Text>;
};

const useStyles = makeStyles((colors) => ({
  label: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
}));
