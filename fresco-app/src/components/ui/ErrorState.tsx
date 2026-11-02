/**
 * Fresco — ErrorState
 * Something broke. Always offers exactly one recovery action
 * (usually "Try again") — never a dead end, never multiple CTAs.
 */

import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { Button } from "./Button";
import { Text } from "./Text";

export type ErrorStateProps = {
  /** Human description of what failed. */
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  /** Vertical inset choice: full fills screen height, inline nests. */
  full?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  message = "Something went wrong. Please try again.",
  retryLabel = "Try again",
  onRetry,
  full = false,
  style,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.xl,
          gap: theme.spacing.m,
          flex: full ? 1 : undefined,
        },
        style,
      ]}
    >
      <Text variant="headline" style={{ textAlign: "center" }}>
        {"Something's not right"}
      </Text>
      <Text variant="caption" color="secondary" style={{ textAlign: "center" }}>
        {message}
      </Text>
      {onRetry != null && <Button label={retryLabel} variant="secondary" small onPress={onRetry} />}
    </View>
  );
}
