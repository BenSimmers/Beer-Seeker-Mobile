import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { fonts, makeStyles, useTheme } from "../../theme";

type Props = {
  label: string;
  /** Sits at the far right of the bar, e.g. a screen's actions menu. */
  accessory?: React.ReactNode;
};

export const BackButton: React.FC<Props> = ({ label, accessory }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation();

  return (
    <View style={styles.bar}>
      <Pressable
        style={styles.button}
        onPress={() => navigation.goBack()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Back to ${label}`}
      >
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
        <Text style={styles.text} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      {accessory}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    maxWidth: "80%",
  },
  text: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
}));
