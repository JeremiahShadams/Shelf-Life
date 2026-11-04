/**
 * Fresco — Profile tab
 * Account identity and the way out. Destructive action (sign out) always
 * asks first; the session itself is cleared from SecureStore by the store.
 */

import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, Card, Text } from "../../components/ui";
import { useAuth } from "../../stores/auth";

export default function ProfileScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius } = theme;

  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const initial = (user?.username ?? "?").slice(0, 1).toUpperCase();

  function confirmSignOut() {
    Alert.alert("Sign out?", "You'll need your email and password to sign back in.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => void logout(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
      >
        <Text variant="largeTitle">Profile</Text>

        <Card style={{ marginTop: spacing.l }}>
          <View style={[styles.row, { gap: spacing.m }]}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.accentSoft, borderRadius: radius.badge },
              ]}
            >
              <Text variant="title" color="accent">
                {initial}
              </Text>
            </View>

            <View style={styles.identity}>
              <Text variant="headline">{user?.username ?? "Signed in"}</Text>
              <Text variant="caption" color="secondary" numberOfLines={1}>
                {user?.email ?? ""}
              </Text>
            </View>
          </View>
        </Card>

        <Text
          variant="micro"
          color="tertiary"
          style={{ marginTop: spacing.l, marginBottom: spacing.s }}
        >
          SESSION
        </Text>

        <Button label="Sign out" variant="danger" block onPress={confirmSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  identity: { flex: 1 },
});
