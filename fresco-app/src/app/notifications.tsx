/**
 * Fresco — Notifications
 * Read-only list of expiry alerts the backend schedules when an item is
 * added. Ordered server-side: unsent first, then by fire time.
 */

import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { Badge, Card, EmptyState, ErrorState, Loading, Text } from "../components/ui";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationItem } from "../types/api";

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;

  const notifications = useNotifications();
  const items = notifications.data?.items ?? [];

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { paddingHorizontal: layout.screenPadding }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="title">Notifications</Text>
        <View style={styles.iconButton} />
      </View>

      {notifications.isLoading ? (
        <Loading fullScreen />
      ) : notifications.isError ? (
        <ErrorState
          full
          title="Couldn't load alerts"
          message="Check your connection and try again."
          retryLabel="Try Again"
          onRetry={() => notifications.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          full
          title="No alerts yet"
          description="Add an item to your inventory and we'll remind you before it expires."
          actionLabel="Add a fruit"
          onAction={() => router.push("/add-item")}
          visual={
            <View
              style={[styles.emptyIcon, { backgroundColor: colors.backgroundMuted }]}
            >
              <Ionicons
                name="notifications-outline"
                size={34}
                color={colors.textPrimary}
              />
            </View>
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: layout.screenPadding,
            paddingTop: spacing.s,
            paddingBottom: spacing.xxl,
            gap: spacing.s,
          }}
          renderItem={({ item }) => <NotificationRow item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const theme = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <Card>
      <View style={[styles.row, { gap: spacing.s }]}>
        <View
          style={[
            styles.alertIcon,
            { backgroundColor: colors.backgroundMuted, borderRadius: radius.badge },
          ]}
        >
          <Ionicons
            name={item.sent ? "checkmark-circle-outline" : "time-outline"}
            size={20}
            color={item.sent ? colors.statusSuccess : colors.statusWarning}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body">{item.message}</Text>
          <Text variant="micro" color="tertiary" style={{ marginTop: spacing.xxs }}>
            {formatWhen(item.notify_at)}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: spacing.s }}>
        <Badge
          label={item.sent ? "Delivered" : "Scheduled"}
          status={item.sent ? "success" : "warning"}
          showDot
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  alertIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
