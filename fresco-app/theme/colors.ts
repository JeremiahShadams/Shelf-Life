/**
 * FRESCO — Natural Agritech & Organic Produce Design System
 * Clean, luminous, artisanal off-white aesthetic.
 *
 * Locked Color Philosophy:
 * - Canvas / Background (Crisp Organic Off-White - #FAF8F5):
 *   Soft, natural, airy off-white canvas that keeps food photography & fresh produce
 *   looking vibrant, crisp, and 100% natural.
 * - Surface (#FFFFFF):
 *   Elevated pure porcelain cards on the off-white canvas with delicate hairline borders.
 * - Primary (Deep Forest Green - #1B5E20):
 *   Headers, branding, and major text elements signaling nature, organic farming & sustainability.
 * - Secondary (Leaf Green - #4A943E):
 *   Subtle categories, cards, and healthy item tags.
 * - Accent (Carrot Orange - #D98327):
 *   Action CTAs, Add-to-Cart, Scan capture triggers to stimulate appetite & action.
 */

export const light = {
  // Canvas & Surfaces (Majorly Off-White)
  background: "#FAF8F5", // Crisp, airy organic off-white canvas
  backgroundMuted: "#F2EFE9", // Soft off-white well/grouping
  surface: "#FFFFFF", // Clean elevated cards on off-white
  surfacePressed: "#EDE9E1",
  surfaceAccent: "#E5E0D6",

  // Primary (Deep Forest Green - #1B5E20): Headers, branding & core identity
  primary: "#1B5E20",
  primaryText: "#FFFFFF",
  secondaryAction: "#EDF5EC", // Soft leaf-green tint
  secondaryActionText: "#1B5E20",

  // Secondary (Leaf Green - #4A943E): Categories, cards & healthy tags
  secondary: "#4A943E",
  secondaryText: "#FFFFFF",

  // Accent (Carrot Orange - #D98327): Action CTAs & appetite stimulus
  accent: "#D98327",
  onAccent: "#FFFFFF",
  accentSoft: "#FEF3E7", // Soft warm carrot cream

  // Status Colors (Natural Food & Ripeness Spectrum)
  statusUrgent: "#C62828", // Heirloom Ripe Tomato
  statusUrgentSoft: "#FCE4E4",
  statusWarning: "#D98327", // Carrot Orange / Ripe Persimmon
  statusWarningSoft: "#FEF3E7",
  statusSuccess: "#4A943E", // Crisp Leaf Green
  statusSuccessSoft: "#EDF5EC",
  statusInfo: "#1976D2", // Pure Spring Water
  statusInfoSoft: "#E3F2FD",

  // Compatibility aliases
  danger: "#C62828",
  dangerSoft: "#FCE4E4",
  warning: "#D98327",
  warningSoft: "#FEF3E7",

  // Typography (Deep Forest Green headers & botanical earth tones)
  textPrimary: "#1B5E20", // Deep Forest Green for branding & headings
  textSecondary: "#37533B", // Dark botanical green for secondary metadata
  textTertiary: "#647E69", // Herbal sage
  textMuted: "#93A897", // Subdued earth

  // Borders (Soft organic off-white hairline borders)
  border: "#E8E3D8",
  borderStrong: "#D6CFBF",

  // Overlays
  overlay: "rgba(27, 94, 32, 0.60)",
  scrim: "rgba(18, 48, 22, 0.75)",
  shadow: "#1B5E20",
} as const;

// Ensure dark mode also retains the crisp off-white aesthetic
export const dark = {
  ...light,
  background: "#FAF8F5",
  backgroundMuted: "#F2EFE9",
  surface: "#FFFFFF",
  surfacePressed: "#EDE9E1",
  surfaceAccent: "#E5E0D6",
  textPrimary: "#1B5E20",
  textSecondary: "#37533B",
  textTertiary: "#647E69",
  textMuted: "#93A897",
  border: "#E8E3D8",
  borderStrong: "#D6CFBF",
} as const;

export type ThemeColors = { [K in keyof typeof light]: string };
