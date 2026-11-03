/**
 * Fresco — Root layout
 * Stack over the tab shell. Screens draw their own titles in content
 * (Things-style large titles), so native headers stay off app-wide.
 */

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
