/**
 * FRESCO — Uber Base Status Badge & Summary Pill
 * - Dot indicator (6px circle)
 * - Uppercase tracking-wider label
 * - Soft status background with high contrast text
 */

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export type BadgeStatus = "urgent" | "warning" | "success" | "expired" | "info" | "calm";
export type BadgeVariant = BadgeStatus;

export type BadgeProps = {
  label: string;
  status?: BadgeStatus;
  daysLeft?: number;
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Badge({
  label,
  status,
  daysLeft,
  showDot = true,
  style,
}: BadgeProps) {
  const theme = useTheme();
  const { colors, spacing, radius } = theme;

  // Resolve status from daysLeft if provided
  let resolvedStatus: BadgeStatus = status ?? "success";
  if (daysLeft !== undefined) {
    if (daysLeft <= 0) {
      resolvedStatus = "expired";
    } else if (daysLeft <= 1) {
      resolvedStatus = "urgent";
    } else if (daysLeft <= 4) {
      resolvedStatus = "warning";
    } else {
      resolvedStatus = "success";
    }
  }

  // Color mapping per Uber Base spec
  let bg = colors.statusSuccessSoft;
  let fg = colors.statusSuccess;

  switch (resolvedStatus) {
    case "urgent":
      bg = colors.statusUrgentSoft;
      fg = colors.statusUrgent;
      break;
    case "warning":
      bg = colors.statusWarningSoft;
      fg = colors.statusWarning;
      break;
    case "expired":
    case "info":
    case "calm":
      bg = colors.statusInfoSoft;
      fg = colors.statusInfo;
      break;
    case "success":
    default:
      bg = colors.statusSuccessSoft;
      fg = colors.statusSuccess;
      break;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: radius.badge,
          paddingHorizontal: spacing.s,
          paddingVertical: spacing.xxs + 1,
        },
        style,
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: fg,
              marginRight: spacing.xxs + 1,
            },
          ]}
        />
      )}
      <Text
        variant="label"
        style={{
          color: fg,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.8,
        }}
      >
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
