/**
 * Fresco — Auth stack
 * Sign-in and registration share a plain stack: no tabs, no back chrome.
 */

import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
