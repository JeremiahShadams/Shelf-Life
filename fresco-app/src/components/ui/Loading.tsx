/**
 * Fresco — Loading
 * Centered spinner. Full-screen variant fills the screen (initial
 * page load); inline variant nests inside cards/sections.
 */

import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";

export type LoadingProps = {
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Loading({ fullScreen = false, style }: LoadingProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        fullScreen
          ? { flex: 1, alignItems: "center", justifyContent: "center" }
          : { padding: theme.spacing.l, alignItems: "center" },
        style,
      ]}
    >
      <ActivityIndicator color={theme.colors.textSecondary} />
    </View>
  );
}
