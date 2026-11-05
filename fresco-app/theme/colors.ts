/**
 * FRESCO — Uber Base Design System Colors
 * High contrast, bold, minimalist.
 * Absolute Black (#000000) and White (#FFFFFF) as primary colors.
 * Uber Blue (#276EF1) only for accents, links, and key indicators.
 */

export const light = {
  // Canvas & Surfaces
  background: "#FFFFFF",
  backgroundMuted: "#F6F6F6",
  surface: "#FFFFFF",
  surfacePressed: "#F3F3F3",
  surfaceAccent: "#EEEEEE",

  // Primary & Actions
  primary: "#000000", // Solid Uber Black
  primaryText: "#FFFFFF",
  secondaryAction: "#F3F3F3",
  secondaryActionText: "#000000",

  // Accent & Brand (Uber Blue)
  accent: "#276EF1",
  onAccent: "#FFFFFF",
  accentSoft: "#EBF2FE",

  // Status Colors (Uber Base)
  statusUrgent: "#E11900", // Red
  statusUrgentSoft: "#FFECE8",
  statusWarning: "#E69500", // Amber
  statusWarningSoft: "#FEF3C7",
  statusSuccess: "#05A357", // Green
  statusSuccessSoft: "#E8F8F0",
  statusInfo: "#545454", // Muted Gray
  statusInfoSoft: "#F3F3F3",

  // Compatibility aliases
  danger: "#E11900",
  dangerSoft: "#FFECE8",
  warning: "#E69500",
  warningSoft: "#FEF3C7",

  // Typography
  textPrimary: "#000000", // Uber Black
  textSecondary: "#545454", // Muted Gray
  textTertiary: "#757575", // Timestamps, captions
  textMuted: "#A6A6A6", // Disabled

  // Borders
  border: "#EEEEEE",
  borderStrong: "#E2E2E2",

  // Overlays
  overlay: "rgba(0, 0, 0, 0.6)",
  scrim: "rgba(0, 0, 0, 0.75)",
  shadow: "#000000",
} as const;

export const dark = {
  background: "#000000",
  backgroundMuted: "#121212",
  surface: "#1A1A1A",
  surfacePressed: "#262626",
  surfaceAccent: "#333333",

  primary: "#FFFFFF",
  primaryText: "#000000",
  secondaryAction: "#262626",
  secondaryActionText: "#FFFFFF",

  accent: "#276EF1",
  onAccent: "#FFFFFF",
  accentSoft: "#102347",

  statusUrgent: "#FF453A",
  statusUrgentSoft: "#3A1010",
  statusWarning: "#FF9F0A",
  statusWarningSoft: "#3A2805",
  statusSuccess: "#30D158",
  statusSuccessSoft: "#0C3015",
  statusInfo: "#8E8E93",
  statusInfoSoft: "#262626",

  danger: "#FF453A",
  dangerSoft: "#3A1010",
  warning: "#FF9F0A",
  warningSoft: "#3A2805",

  textPrimary: "#FFFFFF",
  textSecondary: "#A6A6A6",
  textTertiary: "#757575",
  textMuted: "#545454",

  border: "#262626",
  borderStrong: "#383838",

  overlay: "rgba(0, 0, 0, 0.75)",
  scrim: "rgba(0, 0, 0, 0.85)",
  shadow: "#000000",
} as const;

export type ThemeColors = { [K in keyof typeof light]: string };
