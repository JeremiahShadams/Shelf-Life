/**
 * Fresco — Ideas tab
 * Placeholder: replaced by the Ideas feature slice (recipes ranked by what
 * expires first, compatibility conflicts).
 */

import { View, StyleSheet } from "react-native";
import { Text } from "../../components/ui";
import { useTheme } from "../../../theme";

export default function IdeasScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="largeTitle" style={{ marginLeft: theme.layout.screenPadding }}>
        Ideas
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
