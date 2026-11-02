/**
 * Fresco — Badge (Days-Left & Status Pill)
 * Encodes the single legal semantic color mapping:
 *   days > 4      → textSecondary (calm, nothing to do)
 *   days 2–4      → warning (eat soon)
 *   days 0–1      → danger (eat today / expired)
 */

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export type BadgeVariant = "calm" | "warning" | "danger" | "accent";

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  /** Automatically pick variant from numeric days left */
  daysLeft?: number;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, variant, daysLeft, style }: BadgeProps) {
  const theme = useTheme();
  const { colors, spacing, radius } = theme;

  // Resolve variant from daysLeft if provided
  let resolvedVariant: BadgeVariant = variant ?? "calm";
  if (daysLeft !== undefined) {
    if (daysLeft <= 1) {
      resolvedVariant = "danger";
    } else if (daysLeft <= 4) {
      resolvedVariant = "warning";
    } else {
      resolvedVariant = "calm";
    }
  }

  const bg =
    resolvedVariant === "danger"
      ? colors.dangerSoft
      : resolvedVariant === "warning"
        ? (theme.dark ? "#2C2410" : "#FEF9E7")
        : resolvedVariant === "accent"
          ? colors.accentSoft
          : colors.surfacePressed;

  const fg =
    resolvedVariant === "danger"
      ? colors.danger
      : resolvedVariant === "warning"
        ? colors.warning
        : resolvedVariant === "accent"
          ? colors.accent
          : colors.textSecondary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: radius.badge,
          paddingHorizontal: spacing.s,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
    >
      <Text variant="micro" style={{ color: fg, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
