/**
 * Fresco — Auth stack
 * Sign-in and registration share a plain stack: no tabs, no back chrome.
 */

import { Stack } from "expo-router";
import { useTheme } from "../../../theme";

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
