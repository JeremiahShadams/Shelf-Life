/**
 * FRESCO — Uber Base Empty State Primitive
 * Matches Image 4:
 * - Subtle circular gray badge with outline icon (default: apple/nutrition)
 * - Title: "No items yet" (bold, tight)
 * - Description: "Scan a fruit and tap 'Add to Inventory' to start tracking."
 * - Primary Action button: Solid Black compact button "Scan a fruit"
 */

import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Button } from "./Button";
import { Text } from "./Text";

export type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  visual?: ReactNode;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title = "No items yet",
  description = "Scan a fruit and tap 'Add to Inventory' to start tracking.",
  actionLabel = "Scan a fruit",
  onAction,
  visual,
  full = false,
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;

  return (
    <View
      style={[
        styles.container,
        {
          padding: spacing.xl,
          flex: full ? 1 : undefined,
        },
        style,
      ]}
    >
      {/* Icon Circle */}
      {visual != null ? (
        visual
      ) : (
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: colors.backgroundMuted,
            },
          ]}
        >
          <Ionicons name="nutrition-outline" size={36} color={colors.textPrimary} />
        </View>
      )}

      {/* Title */}
      <Text
        variant="headline"
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            marginTop: spacing.m,
          },
        ]}
      >
        {title}
      </Text>

      {/* Description */}
      {description != null && (
        <Text
          variant="body"
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              marginTop: spacing.xs,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {/* CTA Button */}
      {actionLabel != null && onAction != null && (
        <View style={{ marginTop: spacing.l }}>
          <Button
            label={actionLabel}
            variant="primary"
            small
            block={false}
            onPress={onAction}
            style={styles.actionButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 270,
  },
  actionButton: {
    minWidth: 140,
    paddingHorizontal: 24,
  },
});
