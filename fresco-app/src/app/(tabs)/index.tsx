/**
 * Fresco — Scan (home tab)
 * Placeholder: replaced by the Scan feature slice (camera capture, model
 * result, add-to-fridge flow). Scan stays 503 until the user exports
 * fresco_model.keras (backend task 1.1).
 */

import { View, StyleSheet } from "react-native";
import { Text } from "../../components/ui";
import { useTheme } from "../../../theme";

export default function ScanScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="largeTitle" style={{ marginLeft: theme.layout.screenPadding }}>
        Scan
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
