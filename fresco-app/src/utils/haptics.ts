/**
 * Fresco — Haptics helper
 * Wraps expo-haptics so web, simulators, and devices without haptic motors
 * fail silently without cluttering UI call sites.
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export async function hapticLight(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // unsupported device
  }
}

export async function hapticMedium(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // unsupported device
  }
}

export async function hapticSelection(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // unsupported device
  }
}

export async function hapticSuccess(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // unsupported device
  }
}

export async function hapticWarning(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // unsupported device
  }
}
