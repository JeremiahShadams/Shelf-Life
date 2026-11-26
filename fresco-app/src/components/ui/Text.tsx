/**
 * Fresco — Text
 * The only text primitive. Every string in the app renders through this,
 * so the typographic scale can't drift. No ad-hoc sizes or weights.
 */

import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { useTheme, type TextVariant } from "../../../theme";

export type TextColorName =
  | "primary"
  | "secondary"
  | "tertiary"
  | "brand"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "inverse";

export type TextProps = RNTextProps & {
  /** Typographic role from the locked scale. Defaults to body. */
  variant?: TextVariant;
  /** Token color names — no hex allowed. Defaults to textPrimary. */
  color?: TextColorName;
  align?: TextStyle["textAlign"];
};

const colorMap: Record<TextColorName, keyof ReturnType<typeof useTheme>["colors"]> = {
  primary: "textPrimary",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  brand: "primary",
  accent: "accent",
  success: "statusSuccess",
  warning: "warning",
  danger: "danger",
  inverse: "primaryText",
};

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
