/**
 * FRESCO — Uber Base Typography Scale
 * Typography-driven, bold, tight, commanding.
 */

import { TextStyle } from "react-native";

export const fontFamilies = {
  regular: "System",
  medium: "System",
  semibold: "System",
  bold: "System",
  black: "System",
} as const;

export const fontSizes = {
  largeTitle: 30, // Display H1
  title: 20, // Title H3
  headline: 24, // Headline H2
  cardTitle: 17, // Card Title
  body: 15, // Body
  caption: 14, // Small
  micro: 12, // Micro
  label: 10, // Uppercase Pill Label
  statusLarge: 32, // Card Urgency Number
  statusHuge: 84,
} as const;

export const fontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
  black: "900" as const,
};

export const lineHeights = {
  largeTitle: 36,
  headline: 30,
  title: 26,
  cardTitle: 22,
  body: 22,
  caption: 18,
  micro: 16,
  label: 12,
  statusLarge: 32,
  statusHuge: 84,
} as const;

/**
 * Uber Base Typography Role Presets
 */
export const textVariants: Record<string, TextStyle> = {
  // Legacy & Standard
  largeTitle: {
    fontSize: fontSizes.largeTitle,
    lineHeight: lineHeights.largeTitle,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.6,
  },
  display: {
    fontSize: fontSizes.largeTitle,
    lineHeight: lineHeights.largeTitle,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.6,
  },
  headline: {
    fontSize: fontSizes.headline,
    lineHeight: lineHeights.headline,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.4,
  },
  title: {
    fontSize: fontSizes.title,
    lineHeight: lineHeights.title,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: fontSizes.cardTitle,
    lineHeight: lineHeights.cardTitle,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.medium,
  },
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.medium,
  },
  micro: {
    fontSize: fontSizes.micro,
    lineHeight: lineHeights.micro,
    fontWeight: fontWeights.medium,
  },
  label: {
    fontSize: fontSizes.label,
    lineHeight: lineHeights.label,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusLarge: {
    fontSize: fontSizes.statusLarge,
    lineHeight: lineHeights.statusLarge,
    fontWeight: fontWeights.extrabold,
    letterSpacing: -0.5,
  },
  statusHuge: {
    fontSize: fontSizes.statusHuge,
    lineHeight: lineHeights.statusHuge,
    fontWeight: fontWeights.black,
    letterSpacing: -2,
  },
} as const;

export type TextVariant =
  | "largeTitle"
  | "display"
  | "headline"
  | "title"
  | "cardTitle"
  | "body"
  | "caption"
  | "micro"
  | "label"
  | "statusLarge"
  | "statusHuge";
