/**
 * Fresco — Fridge tab
 * Placeholder: replaced by the Fridge feature slice (inventory list with
 * days-left badges, storage switch, consume/delete).
 */

import { View, StyleSheet } from "react-native";
import { Text } from "../../components/ui";
import { useTheme } from "../../../theme";

export default function FridgeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="largeTitle" style={{ marginLeft: theme.layout.screenPadding }}>
        Fridge
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
