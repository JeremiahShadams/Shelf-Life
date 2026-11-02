/**
 * Fresco — Input
 * Text field wrapper: token styling only, error state built in.
 * The error string renders under the field in the danger color.
 */

import { forwardRef, useState } from "react";
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme";
import { Text } from "./Text";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, style, onFocus, onBlur, ...rest },
  ref,
) {
  const theme = useTheme();
  const { colors, spacing, radius, borders, layout } = theme;
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.textSecondary
      : colors.borderStrong;

  return (
    <View style={[style]}>
      {label != null && (
        <Text variant="micro" color="secondary" style={{ marginBottom: spacing.s }}>
          {label}
        </Text>
      )}

      <TextInput
        ref={ref}
        placeholderTextColor={colors.textTertiary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
        style={[
          {
            height: layout.inputHeight,
            backgroundColor: colors.surface,
            borderRadius: radius.input,
            borderWidth: borders.hairline,
            borderColor,
            paddingHorizontal: spacing.m,
            ...theme.text.body,
            color: colors.textPrimary,
          },
        ]}
      />

      {error ? (
        <Text variant="micro" color="danger" style={{ marginTop: spacing.xs }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="micro" color="tertiary" style={{ marginTop: spacing.xs }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
