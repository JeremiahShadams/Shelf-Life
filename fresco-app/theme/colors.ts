/**
 * FRESCO — Fresh Organic Produce Design System
 * Warm, natural, appetizing food palette.
 * Rich botanical greens (#15803D / #22C55E), fresh crisp produce accents,
 * warm ivory canvas (#F8FAF6), and deep organic forest dark mode (#0D1711).
 */

export const light = {
  // Canvas & Surfaces (Warm, clean organic ivory)
  background: "#F8FAF6",
  backgroundMuted: "#EDF3EB",
  surface: "#FFFFFF",
  surfacePressed: "#F0F5EE",
  surfaceAccent: "#E4EDE1",

  // Primary & Actions (Lush Farmstead Green)
  primary: "#15803D",
  primaryText: "#FFFFFF",
  secondaryAction: "#E8F5E9",
  secondaryActionText: "#166534",

  // Accent & Brand (Fresh Produce Mint / Leaf)
  accent: "#16A34A",
  onAccent: "#FFFFFF",
  accentSoft: "#DCFCE7",

  // Status Colors (Natural Food & Ripeness Spectrum)
  statusUrgent: "#DC2626", // Ripe Strawberry / Tomato Ruby
  statusUrgentSoft: "#FEE2E2",
  statusWarning: "#D97706", // Apricot / Citrus Amber
  statusWarningSoft: "#FEF3C7",
  statusSuccess: "#16A34A", // Crisp Orchard Green
  statusSuccessSoft: "#DCFCE7",
  statusInfo: "#0284C7", // Fresh Water Sky
  statusInfoSoft: "#E0F2FE",

  // Compatibility aliases
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",

  // Typography (Warm deep forest charcoal, not harsh pure black)
  textPrimary: "#14281D",
  textSecondary: "#475B50",
  textTertiary: "#74877D",
  textMuted: "#A0B0A7",

  // Borders
  border: "#E1EAE0",
  borderStrong: "#CAD7C8",

  // Overlays
  overlay: "rgba(20, 40, 29, 0.6)",
  scrim: "rgba(13, 23, 17, 0.75)",
  shadow: "#14281D",
} as const;

export const dark = {
  // Canvas & Surfaces (Lush deep botanical forest night — NOT pitch black void)
  background: "#0D1711",
  backgroundMuted: "#14241B",
  surface: "#1B2D22",
  surfacePressed: "#243C2E",
  surfaceAccent: "#2D4B39",

  // Primary & Actions (Vibrant Spring Sprout)
  primary: "#22C55E",
  primaryText: "#0D1711",
  secondaryAction: "#243C2E",
  secondaryActionText: "#86EFAC",

  // Accent & Brand
  accent: "#22C55E",
  onAccent: "#0D1711",
  accentSoft: "#143821",

  // Status Colors
  statusUrgent: "#EF4444",
  statusUrgentSoft: "#3D1010",
  statusWarning: "#F59E0B",
  statusWarningSoft: "#3D2605",
  statusSuccess: "#22C55E",
  statusSuccessSoft: "#143821",
  statusInfo: "#38BDF8",
  statusInfoSoft: "#133144",

  danger: "#EF4444",
  dangerSoft: "#3D1010",
  warning: "#F59E0B",
  warningSoft: "#3D2605",

  // Typography
  textPrimary: "#F2F7F4",
  textSecondary: "#9BB0A3",
  textTertiary: "#6E8578",
  textMuted: "#4D6155",

  // Borders
  border: "#253B2D",
  borderStrong: "#34503E",

  // Overlays
  overlay: "rgba(7, 13, 9, 0.75)",
  scrim: "rgba(7, 13, 9, 0.85)",
  shadow: "#000000",
} as const;

export type ThemeColors = { [K in keyof typeof light]: string };
