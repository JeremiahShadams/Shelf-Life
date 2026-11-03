/**
 * Fresco — Button
 * ONE primary action per screen. Variants enforce hierarchy:
 *   primary   — the screen's single main action (fills, inverted color)
 *   accent    — the main action only if it means "use/scan now" (green)
 *   secondary — supporting actions (outlined)
 *   ghost     — tertiary/quiet actions (text only)
 *   danger    — destructive actions, always confirmed first
 * Loading and disabled are policy of this component, not per-screen code.
 */

import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Compact height (44pt). */
  small?: boolean;
  /** Stretch to available width. */
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
  block = false,
  loading = false,
  disabled = false,
  leading,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const { colors, spacing, radius, layout, borders } = theme;

  const inactive = disabled || loading;

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "accent"
        ? colors.accent
        : variant === "danger"
          ? colors.dangerSoft
          : variant === "secondary"
            ? colors.surface
            : "transparent";

  const fg =
    variant === "primary"
      ? colors.background
      : variant === "accent"
        ? colors.onAccent
        : variant === "danger"
          ? colors.danger
          : colors.primary;

  // Primary/accent dim on press (fg stays correct); the rest swap surface.
  const swapsSurface = variant === "secondary" || variant === "ghost" || variant === "danger";

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
          borderRadius: radius.button,
          borderWidth: variant === "secondary" ? borders.hairline : 0,
          borderColor: colors.borderStrong,
          opacity: inactive ? 0.45 : pressed && !swapsSurface ? 0.72 : 1,
        },
        pressed && swapsSurface && { backgroundColor: colors.surfacePressed },
        block && styles.block,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {leading != null && <>{leading} </>}
          <Text
            variant={small ? "caption" : "headline"}
            style={{ color: fg, letterSpacing: 0.2 }}
          >
            {label}
          </Text>
        </>
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
  block: {
    alignSelf: "stretch",
  },
});
