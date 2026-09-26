import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, makeStyles, useTheme } from "../../theme";

type Props = {
  name: string;
  onClear: () => void;
};

export const PinnedPill: React.FC<Props> = ({ name, onClear }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.pill}>
      <Ionicons name="star" size={13} color={colors.primary} />
      <Text style={styles.text} numberOfLines={1}>
        Pointing at {name}
      </Text>
      <Pressable
        onPress={onClear}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Stop pointing at this place"
      >
        <Ionicons name="close" size={15} color={colors.muted} />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    maxWidth: "100%",
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
  },
  text: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 0.6,
    flexShrink: 1,
  },
}));
