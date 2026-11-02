/**
 * Fresco — Theme assembly
 * Single source of truth. Components import `useTheme()` — never raw token files.
 *
 * Days-left color logic (the only place semantic colors are used):
 *   days > 4      → textSecondary (calm, nothing to do)
 *   days 2–4      → warning
 *   days 0–1      → danger
 */
import { useColorScheme } from "react-native";
import { useMemo } from "react";
import { light, dark, type ThemeColors } from "./colors";
import { textVariants, type TextVariant } from "./typography";
import { spacing, layout, radius, borders, elevation } from "./spacing";

export type Theme = {
  colors: ThemeColors;
  dark: boolean;
  text: typeof textVariants;
  spacing: typeof spacing;
  layout: typeof layout;
  radius: typeof radius;
  borders: typeof borders;
  elevation: typeof elevation;
};

export type { ThemeColors, TextVariant };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return useMemo<Theme>(
    () => ({
      colors: scheme === "dark" ? dark : light,
      dark: scheme === "dark",
      text: textVariants,
      spacing,
      layout,
      radius,
      borders,
      elevation,
    }),
    [scheme],
  );
}

export * from "./colors";
export * from "./typography";
export * from "./spacing";
