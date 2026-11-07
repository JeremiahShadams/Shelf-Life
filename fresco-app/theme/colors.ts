/**
 * FRESCO — Natural Agritech & Organic Produce Design System
 * Inspired by raw farm produce, local harvests, and eco-conscious food markets.
 *
 * Locked Color Philosophy:
 * - Primary (Deep Forest Green - #1B5E20): Headers, branding, and major text elements signaling nature & sustainability.
 * - Secondary (Leaf Green - #4A943E): Subtle categories, cards, and healthy item tags.
 * - Accent (Carrot Orange - #D98327): Action CTAs, Add-to-Cart, Scan triggers to stimulate appetite & action.
 * - Background/Surface (Warm Milk - #FBF5DD): Soft, natural off-white surface that keeps food images vibrant & accurate.
 */

export const light = {
  // Canvas & Surfaces (Warm Milk #FBF5DD)
  background: "#FBF5DD",
  backgroundMuted: "#F4EDCF",
  surface: "#FFFDF7",
  surfacePressed: "#EDE4C5",
  surfaceAccent: "#E5DAB5",

  // Primary (Deep Forest Green - #1B5E20): Headers, branding & core identity
  primary: "#1B5E20",
  primaryText: "#FFFFFF",
  secondaryAction: "#E8F5E9",
  secondaryActionText: "#1B5E20",

  // Secondary (Leaf Green - #4A943E): Categories, cards & healthy tags
  secondary: "#4A943E",
  secondaryText: "#FFFFFF",

  // Accent (Carrot Orange - #D98327): Action CTAs & appetite stimulus
  accent: "#D98327",
  onAccent: "#FFFFFF",
  accentSoft: "#FDEBD2",

  // Status Colors (Natural Food & Ripeness Spectrum)
  statusUrgent: "#C62828", // Heirloom Ripe Tomato
  statusUrgentSoft: "#FCE4E4",
  statusWarning: "#D98327", // Carrot Orange / Ripe Persimmon
  statusWarningSoft: "#FDEBD2",
  statusSuccess: "#4A943E", // Crisp Leaf Green
  statusSuccessSoft: "#E8F5E9",
  statusInfo: "#1976D2", // Pure Spring Water
  statusInfoSoft: "#E3F2FD",

  // Compatibility aliases
  danger: "#C62828",
  dangerSoft: "#FCE4E4",
  warning: "#D98327",
  warningSoft: "#FDEBD2",

  // Typography (Deep Forest Green headers & botanical earth tones)
  textPrimary: "#1B5E20", // Deep Forest Green for branding & headings
  textSecondary: "#36533A", // Dark botanical green for secondary metadata
  textTertiary: "#617C65", // Herbal sage
  textMuted: "#8FA893", // Subdued earth

  // Borders (Warm cream stone)
  border: "#E5DAB5",
  borderStrong: "#CEC196",

  // Overlays
  overlay: "rgba(27, 94, 32, 0.65)",
  scrim: "rgba(18, 48, 22, 0.78)",
  shadow: "#1B5E20",
} as const;

export const dark = {
  // Canvas & Surfaces (Lush Night Garden / Deep Forest Night)
  background: "#0F1A12",
  backgroundMuted: "#16271B",
  surface: "#1D3324",
  surfacePressed: "#26432F",
  surfaceAccent: "#2F523A",

  // Primary (Luminous Spring Sprout)
  primary: "#4A943E",
  primaryText: "#0F1A12",
  secondaryAction: "#26432F",
  secondaryActionText: "#A5D6A7",

  // Secondary (Leaf Green)
  secondary: "#81C784",
  secondaryText: "#0F1A12",

  // Accent (Radiant Carrot Orange)
  accent: "#E58E34",
  onAccent: "#0F1A12",
  accentSoft: "#3E230B",

  // Status Colors
  statusUrgent: "#EF5350",
  statusUrgentSoft: "#3D1414",
  statusWarning: "#E58E34",
  statusWarningSoft: "#3E230B",
  statusSuccess: "#66BB6A",
  statusSuccessSoft: "#193D1E",
  statusInfo: "#42A5F5",
  statusInfoSoft: "#122E42",

  danger: "#EF5350",
  dangerSoft: "#3D1414",
  warning: "#E58E34",
  warningSoft: "#3E230B",

  // Typography (Warm Milk off-white in dark mode for soft organic glow)
  textPrimary: "#FBF5DD",
  textSecondary: "#C5D8C7",
  textTertiary: "#8EA792",
  textMuted: "#5F7763",

  // Borders
  border: "#284730",
  borderStrong: "#396344",

  // Overlays
  overlay: "rgba(8, 16, 10, 0.75)",
  scrim: "rgba(8, 16, 10, 0.88)",
  shadow: "#000000",
} as const;

export type ThemeColors = { [K in keyof typeof light]: string };
