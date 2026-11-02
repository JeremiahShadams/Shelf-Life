/**
 * Fresco — Typography
 * SF Pro (iOS system) / Inter (bundled or system fallback on Android).
 * Strict scale. No ad-hoc sizes. Every text element uses one of these roles.
 */

export const fontFamilies = {
  regular: "System", // SF Pro on iOS; swap to Inter when bundling on Android
  semibold: "System",
  bold: "System",
} as const;

export const fontSizes = {
  largeTitle: 30, // one per screen max
  title: 21,
  headline: 17, // card titles, section headers
  body: 16,
  caption: 14,
  micro: 13, // timestamps, badges
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeights = {
  largeTitle: 36,
  title: 26,
  headline: 22,
  body: 22,
  caption: 19,
  micro: 16,
} as const;

/**
 * Role presets — components consume these, never raw numbers.
 * Usage: <Text variant="title">…</Text>
 */
export const textVariants = {
  largeTitle: {
    fontSize: fontSizes.largeTitle,
    lineHeight: lineHeights.largeTitle,
    fontWeight: fontWeights.bold,
  },
  title: {
    fontSize: fontSizes.title,
    lineHeight: lineHeights.title,
    fontWeight: fontWeights.semibold,
  },
  headline: {
    fontSize: fontSizes.headline,
    lineHeight: lineHeights.headline,
    fontWeight: fontWeights.semibold,
  },
  body: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.regular,
  },
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.regular,
  },
  micro: {
    fontSize: fontSizes.micro,
    lineHeight: lineHeights.micro,
    fontWeight: fontWeights.medium,
  },
} as const;

export type TextVariant = keyof typeof textVariants;
