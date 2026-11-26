/**
 * FRESCO — Botanical Editorial Typography Scale
 * Pairs expressive Fraunces display typography (wordmark, headings, large urgency
 * numerals) with clean platform humanist sans-serif for crisp body legibility.
 */

import { TextStyle } from "react-native";

export const fontFamilies = {
  regular: "System",
  medium: "System",
  semibold: "System",
  bold: "System",
  black: "System",
  displayBold: "Fraunces_700Bold",
  displayExtraBold: "Fraunces_800ExtraBold",
  displayBlack: "Fraunces_900Black",
} as const;

export const fontSizes = {
  wordmark: 38,
  largeTitle: 30,
  headline: 24,
  title: 20,
  cardTitle: 17,
  body: 15,
  caption: 14,
  cardMeta: 13,
  micro: 12,
  label: 10,
  statusLarge: 32,
  statusHuge: 72,
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
  wordmark: 44,
  largeTitle: 36,
  headline: 30,
  title: 26,
  cardTitle: 22,
  body: 22,
  caption: 19,
  cardMeta: 18,
  micro: 16,
  label: 13,
  statusLarge: 36,
  statusHuge: 76,
} as const;

export const textVariants: Record<string, TextStyle> = {
  wordmark: {
    fontFamily: fontFamilies.displayBlack,
    fontSize: fontSizes.wordmark,
    lineHeight: lineHeights.wordmark,
    letterSpacing: -1.0,
  },
  largeTitle: {
    fontFamily: fontFamilies.displayExtraBold,
    fontSize: fontSizes.largeTitle,
    lineHeight: lineHeights.largeTitle,
    letterSpacing: -0.6,
  },
  display: {
    fontFamily: fontFamilies.displayExtraBold,
    fontSize: fontSizes.largeTitle,
    lineHeight: lineHeights.largeTitle,
    letterSpacing: -0.6,
  },
  headline: {
    fontFamily: fontFamilies.displayBold,
    fontSize: fontSizes.headline,
    lineHeight: lineHeights.headline,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    fontSize: fontSizes.title,
    lineHeight: lineHeights.title,
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
  bodyStrong: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.bold,
  },
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.medium,
  },
  cardMeta: {
    fontSize: fontSizes.cardMeta,
    lineHeight: lineHeights.cardMeta,
    fontWeight: fontWeights.regular,
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
    letterSpacing: 0.6,
  },
  statusLarge: {
    fontFamily: fontFamilies.displayExtraBold,
    fontSize: fontSizes.statusLarge,
    lineHeight: lineHeights.statusLarge,
    letterSpacing: -0.6,
  },
  statusHuge: {
    fontFamily: fontFamilies.displayBlack,
    fontSize: fontSizes.statusHuge,
    lineHeight: lineHeights.statusHuge,
    letterSpacing: -2,
  },
} as const;

export type TextVariant =
  | "wordmark"
  | "largeTitle"
  | "display"
  | "headline"
  | "title"
  | "cardTitle"
  | "body"
  | "bodyStrong"
  | "caption"
  | "cardMeta"
  | "micro"
  | "label"
  | "statusLarge"
  | "statusHuge";
