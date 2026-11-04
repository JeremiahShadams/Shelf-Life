/**
 * FRESCO — Uber Base Button Primitive
 * Core Rules:
 *   - Primary: Solid Black (#000000) with White (#FFFFFF) text
 *   - Secondary: Light Gray (#F3F3F3) with Black text & subtle border
 *   - Height: 56px (h-14), rounded-xl (12px)
 *   - Active state: 98% scale for tactile feedback
 */

import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  small?: boolean;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  small = false,
  block = true,
  loading = false,
  disabled = false,
  leading,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const { colors, spacing, radius, layout } = theme;

  const inactive = disabled || loading;

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.secondaryAction
        : variant === "accent"
          ? colors.accent
          : variant === "danger"
            ? colors.statusUrgentSoft
            : "transparent";

  const fg =
    variant === "primary"
      ? colors.primaryText
      : variant === "secondary"
        ? colors.secondaryActionText
        : variant === "accent"
          ? colors.onAccent
          : variant === "danger"
            ? colors.statusUrgent
            : colors.textPrimary;

  const hasBorder = variant === "secondary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          height: small ? layout.buttonHeightSmall : layout.buttonHeight,
          backgroundColor: bg,
          paddingHorizontal: small ? spacing.m : spacing.l,
          borderRadius: small ? radius.sm : radius.button,
          borderWidth: hasBorder ? 1 : 0,
          borderColor: colors.border,
          opacity: inactive ? 0.45 : 1,
          transform: [{ scale: pressed && !inactive ? 0.98 : 1 }],
        },
        block && styles.block,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {leading != null && <View style={{ marginRight: spacing.xs }}>{leading}</View>}
          <Text
            variant={small ? "caption" : "body"}
            style={{
              color: fg,
              fontWeight: "700",
              letterSpacing: -0.2,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  block: {
    alignSelf: "stretch",
    width: "100%",
  },
});
