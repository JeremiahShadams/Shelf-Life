/**
 * Fresco — Profile tab
 * Placeholder: replaced by the Profile feature slice (account, sign in/out,
 * notification settings).
 */

import { View, StyleSheet } from "react-native";
import { Text } from "../../components/ui";
import { useTheme } from "../../../theme";

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="largeTitle" style={{ marginLeft: theme.layout.screenPadding }}>
        Profile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
