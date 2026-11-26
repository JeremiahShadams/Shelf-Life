/**
 * FRESCO — Natural Agritech & Organic Produce Design System
 * Clean, luminous, artisanal off-white aesthetic.
 *
 * Color Philosophy:
 * - Canvas / Background (#FAF8F5):
 *   Soft, airy organic off-white canvas that keeps food photography vibrant.
 * - Surface (#FFFFFF):
 *   Elevated porcelain cards on the off-white canvas with hairline borders.
 * - Primary (Deep Forest Green - #1B5E20):
 *   Reserved deliberately for wordmarks, active tabs, and brand anchors.
 * - Secondary (Leaf Green - #4A943E):
 *   Freshness status, optimal storage tags, and healthy vitality signals.
 * - Accent (Carrot Orange - #D98327):
 *   High-intent capture triggers, add-to-fridge CTAs, and appetite stimulus.
 * - Primary Ink (#1A241B):
 *   Deep organic charcoal-forest for readable body copy, titles, and data.
 */

export const light = {
  // Canvas & Surfaces (Majorly Off-White)
  background: "#FAF8F5",
  backgroundMuted: "#F2EFE9",
  surface: "#FFFFFF",
  surfacePressed: "#EDE9E1",
  surfaceAccent: "#E5E0D6",

  // Primary (Deep Forest Green - #1B5E20): Brand anchors & active states
  primary: "#1B5E20",
  primaryText: "#FFFFFF",
  secondaryAction: "#EDF5EC",
  secondaryActionText: "#1B5E20",

  // Secondary (Leaf Green - #4A943E): Categories & freshness
  secondary: "#4A943E",
  secondaryText: "#FFFFFF",

  // Accent (Carrot Orange - #D98327): Action CTAs & appetite stimulus
  accent: "#D98327",
  onAccent: "#FFFFFF",
  accentSoft: "#FEF3E7",

  // Status Colors (Natural Food & Ripeness Spectrum)
  statusUrgent: "#C62828", // Heirloom Ripe Tomato / Expired / Spoiled
  statusUrgentSoft: "#FCE4E4",
  statusWarning: "#D98327", // Carrot Orange / Eat Soon / Low Confidence
  statusWarningSoft: "#FEF3E7",
  statusSuccess: "#4A943E", // Crisp Leaf Green / Fresh
  statusSuccessSoft: "#EDF5EC",
  statusInfo: "#1976D2", // Informational only — never used for expired food
  statusInfoSoft: "#E3F2FD",

  // Compatibility aliases
  danger: "#C62828",
  dangerSoft: "#FCE4E4",
  warning: "#D98327",
  warningSoft: "#FEF3E7",

  // Typography (Organic Charcoal Ink — Deep Forest Green stays reserved for brand accents)
  textPrimary: "#1A241B",
  textSecondary: "#435645",
  textTertiary: "#677A69",
  textMuted: "#93A395",

  // Toast high-contrast surface
  toastBg: "#1A241B",
  toastText: "#FFFFFF",
  toastIcon: "#6EE7B7",

  // Borders (Soft organic off-white hairline borders)
  border: "#E8E3D8",
  borderStrong: "#D6CFBF",

  // Overlays
  overlay: "rgba(26, 36, 27, 0.58)",
  scrim: "rgba(18, 28, 20, 0.80)",
  shadow: "#1A241B",
} as const;

export const dark = {
  ...light,
} as const;

export type ThemeColors = { [K in keyof typeof light]: string };
