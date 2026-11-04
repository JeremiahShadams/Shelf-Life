/**
 * FRESCO — Uber Base Spacing & Layout System
 * 4px/8px grid system with Uber scale.
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16, // Default card & element padding
  l: 20, // Mobile container horizontal padding (px-5)
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const layout = {
  screenPadding: 20, // 20px (px-5) container padding on mobile
  cardPadding: 16, // 16px (p-4)
  headerHeight: 56,
  navBarHeight: 80,
  safeAreaBottom: 34,

  buttonHeight: 56, // 56px (h-14) primary/secondary button
  buttonHeightSmall: 40,
  inputHeight: 52,

  fabSize: 56, // 56px floating action button
  iconButtonSize: 44,
  tapTarget: 44,
} as const;

export const radius = {
  xs: 4,
  badge: 999, // Pill shape
  sm: 8,
  card: 12, // 12px (rounded-xl)
  button: 12, // 12px (rounded-xl)
  input: 12,
  modal: 16, // 16px (rounded-2xl)
  sheet: 24, // 24px (rounded-t-3xl)
  full: 9999,
} as const;

export const borders = {
  hairline: 1,
  strong: 1.5,
  accentStrip: 4, // 4px vertical status border on card left
} as const;

/** Subtle, functional Uber-style shadows */
export const elevation = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  uber: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  sheet: {
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  modal: {
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
} as const;
