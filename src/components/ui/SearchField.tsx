import React from "react";
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, makeStyles, useTheme } from "../../theme";

type Props = Pick<
  TextInputProps,
  "value" | "onChangeText" | "onSubmitEditing" | "placeholder" | "returnKeyType" | "autoFocus"
> & {
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const SearchField: React.FC<Props> = ({ onClear, style, value, ...input }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.bar, style]}>
      <Ionicons name="search-outline" size={17} color={colors.muted} />
      <TextInput
        style={styles.input}
        value={value}
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        {...input}
      />
      {onClear && !!value && (
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={17} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 46,
  },
  input: {
    flex: 1,
    color: colors.headline,
    fontFamily: fonts.body,
    fontSize: 14,
    height: "100%",
  },
}));
