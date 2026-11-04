/**
 * FRESCO — Uber Base Floating Action Button (FAB)
 * Circular 56px solid black button with white '+' icon.
 * Positioned above bottom navigation with functional shadow.
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";

export type FABProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function FAB({ onPress, accessibilityLabel = "Add item to inventory", style }: FABProps) {
  const theme = useTheme();
  const { colors, layout } = theme;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          width: layout.fabSize,
          height: layout.fabSize,
          borderRadius: layout.fabSize / 2,
          backgroundColor: colors.primary,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        styles.shadow,
        style,
      ]}
    >
      <Ionicons name="add" size={28} color={colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});

