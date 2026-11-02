/**
 * Fresco — Card
 * Surface container: surface color, 16pt radius, hairline border,
 * optional soft shadow (iOS only — shadows read muddy on Android).
 * Pass onPress to make the whole card tappable (list rows).
 */

import { forwardRef, type ReactNode } from "react";
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";

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

export const Card = forwardRef<View, CardProps>(function Card(
  { children, floating = false, plain = false, onPress, disabled = false, style },
  ref,
) {
  const theme = useTheme();
  const { colors, spacing, radius, borders, elevation } = theme;

  const container = (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.card,
          borderWidth: borders.hairline,
          borderColor: colors.border,
          padding: plain ? 0 : spacing.m,
          ...(floating && Platform.OS === "ios" ? elevation.card : null),
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) {
    return container;
  }

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      {container}
    </Pressable>
  );
});
