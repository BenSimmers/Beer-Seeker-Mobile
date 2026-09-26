import React from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fonts, makeStyles } from "../../theme";

type ErrorBannerProps = {
  message: string;
  style?: StyleProp<ViewStyle>;
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, style }) => {
  const styles = useStyles();
  return (
    <View style={[styles.errorBox, style]}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: "center",
  },
}));
