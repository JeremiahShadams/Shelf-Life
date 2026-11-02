/**
 * Fresco — Profile & Settings Screen
 * User account, notification preferences, appearance, and stats.
 */

import { useState } from "react";
import { StyleSheet, View, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Text, Card, Button } from "../../components/ui";
import { useAuthStore } from "../../stores/authStore";
import { useFridgeStore } from "../../stores/fridgeStore";

export default function ProfileScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;
  const { user, clearSession } = useAuthStore();
  const { items } = useFridgeStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  const consumedCount = items.filter((i) => i.is_consumed).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xxl },
        ]}
      >
        {/* Header */}
        <View style={{ marginTop: spacing.m, marginBottom: spacing.l }}>
          <Text variant="largeTitle">Profile</Text>
          <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
            Settings, notifications, and food stats.
          </Text>
        </View>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: colors.surfacePressed }]}>
            <Ionicons name="person" size={28} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.m }}>
            <Text variant="headline">{user?.username || "Everyday Cook"}</Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              {user?.email || "cook@fresco.app"}
            </Text>
          </View>
        </Card>

        {/* Impact Stats */}
        <View style={[styles.statsRow, { marginVertical: spacing.m }]}>
          <Card style={{ flex: 1, alignItems: "center", paddingVertical: spacing.m }}>
            <Text variant="title" color="accent">
              {consumedCount}
            </Text>
            <Text variant="micro" color="secondary" style={{ marginTop: 2 }}>
              Items Saved
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: "center", paddingVertical: spacing.m }}>
            <Text variant="title">
              {items.filter((i) => !i.is_consumed).length}
            </Text>
            <Text variant="micro" color="secondary" style={{ marginTop: 2 }}>
              In Fridge
            </Text>
          </Card>
        </View>

        {/* Notifications Section */}
        <View style={{ marginTop: spacing.m }}>
          <Text variant="micro" color="tertiary" style={{ fontWeight: "600", marginBottom: spacing.xs }}>
            NOTIFICATIONS
          </Text>
          <Card style={{ gap: spacing.m }}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="headline">Expiry Alerts</Text>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                  Warn me 24h before an item spoils
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text variant="headline">Daily 9 AM Digest</Text>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                  Summary of foods to use today
                </Text>
              </View>
              <Switch
                value={dailyDigest}
                onValueChange={setDailyDigest}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>
          </Card>
        </View>

        {/* Appearance Info */}
        <View style={{ marginTop: spacing.l }}>
          <Text variant="micro" color="tertiary" style={{ fontWeight: "600", marginBottom: spacing.xs }}>
            APPEARANCE
          </Text>
          <Card style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text variant="headline">Theme</Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                Matches your system preference ({theme.dark ? "Dark" : "Light"})
              </Text>
            </View>
            <Ionicons name={theme.dark ? "moon" : "sunny"} size={20} color={colors.textSecondary} />
          </Card>
        </View>

        {/* Logout */}
        <View style={{ marginTop: spacing.xl }}>
          <Button
            label="Log Out"
            variant="ghost"
            small
            block
            onPress={clearSession}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: {
    height: 1,
  },
});

