import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { fonts, makeStyles, useTheme } from "../../theme";

type FieldProps = Pick<
  TextInputProps,
  | "value"
  | "onChangeText"
  | "onSubmitEditing"
  | "placeholder"
  | "secureTextEntry"
  | "autoComplete"
  | "keyboardType"
  | "textContentType"
  | "returnKeyType"
  | "autoCapitalize"
  | "multiline"
  | "maxLength"
> & {
  label: string;
  hint?: string;
};

export const Field: React.FC<FieldProps> = ({
  label,
  hint,
  autoCapitalize = "none",
  multiline,
  ...input
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...input}
      />
      {hint != null && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
};

export const PrimaryButton: React.FC<ButtonProps> = ({ title, onPress, busy, disabled }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const inactive = busy || disabled;

  return (
    <Pressable
      style={[styles.button, inactive && styles.buttonInactive]}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
    >
      {busy ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
};

const useStyles = makeStyles((colors) => ({
  label: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 46,
    color: colors.headline,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 92,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  hint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 6,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonInactive: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontFamily: fonts.labelBold,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
}));
