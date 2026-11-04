/**
 * FRESCO — Uber Base Error State Primitive
 * Matches Image 5:
 * - Soft red circle with red alert-triangle icon
 * - Title: "Couldn't load inventory"
 * - Description: "Something went wrong while fetching your items."
 * - Primary Action button: Solid Black compact button "Try Again"
 */

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Button } from "./Button";
import { Text } from "./Text";

export type ErrorStateProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  title = "Couldn't load inventory",
  message = "Something went wrong while fetching your items.",
  retryLabel = "Try Again",
  onRetry,
  full = false,
  style,
}: ErrorStateProps) {
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
      {/* Red Alert Icon Circle */}
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.statusUrgentSoft,
          },
        ]}
      >
        <Ionicons name="warning-outline" size={36} color={colors.statusUrgent} />
      </View>

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

      {/* Message */}
      {message != null && (
        <Text
          variant="body"
          style={[
            styles.message,
            {
              color: colors.textSecondary,
              marginTop: spacing.xs,
            },
          ]}
        >
          {message}
        </Text>
      )}

      {/* Retry CTA */}
      {onRetry != null && (
        <View style={{ marginTop: spacing.l }}>
          <Button
            label={retryLabel}
            variant="primary"
            small
            block={false}
            onPress={onRetry}
            style={styles.retryButton}
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
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 270,
  },
  retryButton: {
    minWidth: 140,
    paddingHorizontal: 24,
  },
});
