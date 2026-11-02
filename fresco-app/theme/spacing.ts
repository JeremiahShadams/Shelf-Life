/**
 * Fresco — Spacing & Layout
 * 8pt system. Only these values, nothing between them.
 * Screen padding is always 20 (mobile-first, generous gutters).
 * Cards: border 1px + optional very soft shadow (iOS only — shadows look muddy on Android).
 */

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
} as const;

export const layout = {
  screenPadding: 20, // horizontal page gutter — never deviate
  cardPadding: 16,
  listItemGap: 12,
  sectionGap: 24, // vertical space between content sections

  navBarHeight: 56,
  navItemMaxWidth: 96,

  buttonHeight: 52, // primary/secondary CTA height
  buttonHeightSmall: 44, // == tapTarget for compact actions

  tapTarget: 44, // Apple minimum hit area
  cameraButton: 72, // big Scan button on home
} as const;

export const radius = {
  card: 16,
  button: 14,
  input: 12,
  badge: 999, // pill
  sheet: 24, // bottom sheets / scan-result card
} as const;

export const borders = {
  hairline: 1,
  strong: 1.5,
} as const;

/** Very soft shadow. Use on floating elements only (cards on top of scroll, sheets, FAB). */
export const elevation = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  floating: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
} as const;
