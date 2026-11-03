/**
 * Fresco — Colors
 * Restrained, calm, precise. Two modes.
 * Rule: accent green is a signal, not decoration. If it doesn't mean
 * "use this now", it should not be green.
 */

export const light = {
  background: "#FAFAFA",
  backgroundMuted: "#F2F2F2",
  surface: "#FFFFFF",
  surfacePressed: "#F5F5F5",

  primary: "#1C1C1C", // primary action (buttons, key CTA)
  accent: "#2F9E44", // fresh green — sparingly: freshness, success
  onAccent: "#FFFFFF", // text/icon sitting on accent green
  accentSoft: "#E6F4EA", // 8% green tint for subtle backgrounds
  warning: "#E5A100",
  warningSoft: "#FEF9E7",
  danger: "#D14343",
  dangerSoft: "#FBEAEA",

  textPrimary: "#111111",
  textSecondary: "#6B6B6B",
  textTertiary: "#9E9E9E", // timestamps, disabled

  border: "#EAEAEA",
  borderStrong: "#D9D9D9",

  overlay: "rgba(0, 0, 0, 0.4)",
  scrim: "rgba(17, 17, 17, 0.6)", // camera shutter overlay
} as const;

export const dark = {
  background: "#0F0F0F",
  backgroundMuted: "#161616",
  surface: "#1A1A1A",
  surfacePressed: "#242424",

  primary: "#F5F5F5", // inverted: primary action is near-white
  accent: "#4CAF50",
  onAccent: "#0F0F0F",
  accentSoft: "#122815",
  warning: "#F0B429",
  warningSoft: "#2C2410",
  danger: "#E05252",
  dangerSoft: "#2C1414",

  textPrimary: "#F5F5F5",
  textSecondary: "#A0A0A0",
  textTertiary: "#6B6B6B",

  border: "#2A2A2A",
  borderStrong: "#3D3D3D",

  overlay: "rgba(0, 0, 0, 0.6)",
  scrim: "rgba(0, 0, 0, 0.7)",
} as const;

export type ThemeColors = { [K in keyof typeof light]: string };
