/**
 * FRESCO — Status Badge & Summary Pill
 * - Dot indicator (6px circle)
 * - Soft status background with high-contrast text
 * - Semantic colors: expired/urgent strictly map to Crimson, never Blue.
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
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Badge({
  label,
  status,
  daysLeft,
  showDot = true,
  active = false,
  style,
}: BadgeProps) {
  const theme = useTheme();
  const { colors, spacing, radius } = theme;

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

  let bg = colors.statusSuccessSoft;
  let fg = colors.statusSuccess;

  switch (resolvedStatus) {
    case "expired":
    case "urgent":
      bg = colors.statusUrgentSoft;
      fg = colors.statusUrgent;
      break;
    case "warning":
      bg = colors.statusWarningSoft;
      fg = colors.statusWarning;
      break;
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
          paddingVertical: spacing.xxs + 2,
          borderWidth: active ? 1.5 : 1,
          borderColor: active ? fg : "transparent",
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
              marginRight: spacing.xxs + 2,
            },
          ]}
        />
      )}
      <Text variant="label" style={{ color: fg }}>
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
