/**
 * Fresco — Card
 * Surface container: surface color, 16pt radius, hairline border,
 * optional soft shadow (iOS only — shadows read muddy on Android).
 * Pass onPress to make the whole card tappable (list rows).
 */

import { type ReactNode } from "react";
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";

export type CardProps = {
  children: ReactNode;
  /** Soft shadow — floating cards only (top of scroll, sheets, FAB). */
  floating?: boolean;
  /** Remove default inner padding (for full-bleed content like images). */
  plain?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  floating = false,
  plain = false,
  onPress,
  disabled = false,
  style,
}: CardProps) {
  const theme = useTheme();
  const { colors, spacing, radius, borders, elevation } = theme;

  const innerStyle = [
    {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: borders.hairline,
      borderColor: colors.border,
      padding: plain ? 0 : spacing.m,
      ...(floating && Platform.OS === "ios" ? elevation.card : null),
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }, innerStyle]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={innerStyle}>{children}</View>;
}
