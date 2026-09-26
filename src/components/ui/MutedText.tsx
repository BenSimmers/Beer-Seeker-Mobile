import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { fonts, makeStyles } from "../../theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

export const MutedText: React.FC<Props> = ({ children, style }) => {
  const styles = useStyles();
  return <Text style={[styles.text, style]}>{children}</Text>;
};

const useStyles = makeStyles((colors) => ({
  text: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
  },
}));
