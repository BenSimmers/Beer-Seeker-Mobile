import React from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fonts, makeStyles } from "../../theme";

type Props = {
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const PageTitle: React.FC<Props> = ({ title, subtitle, accessory, style }) => {
  const styles = useStyles();
  return (
    <View style={[styles.container, style]}>
      <View style={styles.top}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {accessory}
      </View>
      {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 32,
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  subtitle: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
}));
