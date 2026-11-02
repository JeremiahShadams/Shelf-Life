/**
 * Fresco — EmptyState
 * Legitimately-nothing-here state. Tells the user what this space is for
 * and offers the one action that fills it (e.g. "Scan your first item").
 */

import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { Button } from "./Button";
import { Text } from "./Text";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional leading visual (emoji or a small SVG). */
  visual?: ReactNode;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  visual,
  full = false,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.xl,
          gap: theme.spacing.s,
          flex: full ? 1 : undefined,
        },
        style,
      ]}
    >
      {visual != null && <View style={{ marginBottom: theme.spacing.s }}>{visual}</View>}
      <Text variant="headline" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {description != null && (
        <Text variant="caption" color="secondary" style={{ textAlign: "center" }}>
          {description}
        </Text>
      )}
      {actionLabel != null && onAction != null && (
        <View style={{ marginTop: theme.spacing.m }}>
          <Button label={actionLabel} onPress={onAction} small />
        </View>
      )}
    </View>
  );
}
