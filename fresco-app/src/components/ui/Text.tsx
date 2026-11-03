/**
 * Fresco — Text
 * The only text primitive. Every string in the app renders through this,
 * so the typographic scale can't drift. No ad-hoc sizes or weights.
 */

import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { useTheme, type TextVariant } from "../../../theme";

export type TextProps = RNTextProps & {
  /** Typographic role from the locked scale. Defaults to body. */
  variant?: TextVariant;
  /** Token color names — no hex allowed. Defaults to textPrimary. */
  color?: "primary" | "secondary" | "tertiary" | "accent" | "warning" | "danger";
  align?: TextStyle["textAlign"];
};

const colorMap = {
  primary: "textPrimary",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  accent: "accent",
  warning: "warning",
  danger: "danger",
} as const;

export function Text({ variant = "body", color = "primary", align, style, ...rest }: TextProps) {
  const theme = useTheme();

  return (
    <RNText
      {...rest}
      style={[
        theme.text[variant],
        { color: theme.colors[colorMap[color]] },
        align != null && { textAlign: align },
        style,
      ]}
    />
  );
}
