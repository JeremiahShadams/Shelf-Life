/**
 * Fresco — Profile tab
 * Account identity and the way out. Destructive action (sign out) always
 * asks first; the session itself is cleared from SecureStore by the store.
 */

import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Badge, Button, Card, Text } from "../../components/ui";
import { useAuth } from "../../stores/auth";
import { useHealth } from "../../hooks/useHealth";
import { useNotifications } from "../../hooks/useNotifications";

export default function ProfileScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius } = theme;

  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const notifications = useNotifications();
  const health = useHealth();

  const alertCount = notifications.data?.total ?? 0;
  const aiScanning = health.data?.ai_scanning ?? "unknown";

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
          APP
        </Text>

        <View style={{ gap: spacing.s }}>
          <Card onPress={() => router.push("/notifications")}>
            <View style={[styles.row, { gap: spacing.m }]}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: colors.backgroundMuted, borderRadius: radius.badge },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </View>
              <View style={styles.identity}>
                <Text variant="cardTitle">Notifications</Text>
                <Text variant="caption" color="secondary">
                  {alertCount > 0
                    ? `${alertCount} expiry ${alertCount === 1 ? "alert" : "alerts"}`
                    : "No alerts yet"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </View>
          </Card>

          <Card>
            <View style={[styles.row, { gap: spacing.m }]}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: colors.backgroundMuted, borderRadius: radius.badge },
                ]}
              >
                <Ionicons name="sparkles-outline" size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.identity}>
                <Text variant="cardTitle">AI scanning</Text>
                <Text variant="caption" color="secondary">
                  {aiScanning === "available"
                    ? `Model ready${health.data?.version ? ` · v${health.data.version}` : ""}`
                    : aiScanning === "unavailable"
                      ? "Model not deployed — add items by name"
                      : "Couldn't reach the server"}
                </Text>
              </View>
              <Badge
                label={
                  aiScanning === "available"
                    ? "Ready"
                    : aiScanning === "unavailable"
                      ? "Not ready"
                      : "Unknown"
                }
                status={
                  aiScanning === "available"
                    ? "success"
                    : aiScanning === "unavailable"
                      ? "warning"
                      : "info"
                }
              />
            </View>
          </Card>
        </View>

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
  rowIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  identity: { flex: 1 },
});
