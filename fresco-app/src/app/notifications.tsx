/**
 * FRESCO — Notifications Screen
 * Matches SuperDesign extended inventory draft:
 * - Segmented Filter Tabs: "All" vs "Unread" with unread badge count
 * - Notification cards with left vertical accent strips (Red for urgent, Amber for warning, Gray for read)
 * - 40x40 circular colored icon badges
 * - Unread indicator dots & relative timestamps
 */

import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { EmptyState, ErrorState, Loading, Text } from "../components/ui";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../hooks/useNotifications";
import { parseServerDate } from "../utils/datetime";
import type { NotificationItem } from "../types/api";

type FilterTab = "all" | "unread";

function formatRelativeTime(value: string): string {
  const date = parseServerDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffHours) < 1) return "Just now";
  if (diffHours > 0 && diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffHours < 0 && diffHours > -24) return `In ${Math.abs(diffHours)} hours`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays === -1) return "Tomorrow";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notificationsQuery.data?.items ?? [];

  // Consider an item unread if not sent or marked
  const unreadItems = useMemo(
    () => items.filter((n) => !n.sent),
    [items],
  );

  const displayedItems = activeTab === "unread" ? unreadItems : items;

  const handleCardPress = (item: NotificationItem) => {
    if (!item.sent) {
      markRead.mutate(item.id);
    }
    if (item.inventory_id) {
      router.push({
        pathname: "/inventory/[id]",
        params: { id: String(item.inventory_id) },
      });
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.headerContainer, { paddingHorizontal: layout.screenPadding }]}>
        <View style={styles.headerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <Text variant="largeTitle" style={styles.screenTitle}>
            Notifications
          </Text>

          {unreadItems.length > 0 ? (
            <Pressable
              onPress={() => markAllRead.mutate()}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingVertical: 4 }]}
            >
              <Text variant="caption" style={{ color: colors.primary, fontWeight: "600" }}>
                Read all
              </Text>
            </Pressable>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        {/* Filter Tabs (All / Unread) */}
        <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "all" }}
            onPress={() => setActiveTab("all")}
            style={[
              styles.tabButton,
              activeTab === "all" && [
                styles.tabButtonActive,
                { borderBottomColor: colors.primary },
              ],
            ]}
          >
            <Text
              variant="body"
              style={[
                styles.tabText,
                {
                  color: activeTab === "all" ? colors.textPrimary : colors.textSecondary,
                  fontWeight: activeTab === "all" ? "700" : "500",
                },
              ]}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "unread" }}
            onPress={() => setActiveTab("unread")}
            style={[
              styles.tabButton,
              styles.unreadTabButton,
              activeTab === "unread" && [
                styles.tabButtonActive,
                { borderBottomColor: colors.primary },
              ],
            ]}
          >
            <Text
              variant="body"
              style={[
                styles.tabText,
                {
                  color: activeTab === "unread" ? colors.textPrimary : colors.textSecondary,
                  fontWeight: activeTab === "unread" ? "700" : "500",
                },
              ]}
            >
              Unread
            </Text>

            {unreadItems.length > 0 && (
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: colors.statusUrgent },
                ]}
              >
                <Text style={styles.badgePillText}>{unreadItems.length}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      {notificationsQuery.isLoading ? (
        <Loading fullScreen />
      ) : notificationsQuery.isError ? (
        <ErrorState
          full
          title="Couldn't load alerts"
          message="Check your connection and try again."
          retryLabel="Try Again"
          onRetry={() => notificationsQuery.refetch()}
        />
      ) : displayedItems.length === 0 ? (
        activeTab === "unread" ? (
          <EmptyState
            full
            title="All caught up"
            description="You have no unread notifications right now."
            actionLabel="View all notifications"
            onAction={() => setActiveTab("all")}
          />
        ) : (
          <EmptyState
            full
            title="No alerts yet"
            description="Add an item to your inventory and we'll remind you before it expires."
            actionLabel="Add a fruit"
            onAction={() => router.push("/add-item")}
            visual={
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.backgroundMuted },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={34}
                  color={colors.textPrimary}
                />
              </View>
            }
          />
        )
      ) : (
        <FlatList
          data={displayedItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: layout.screenPadding, paddingTop: spacing.s },
          ]}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onPress={() => handleCardPress(item)}
            />
          )}
          ListHeaderComponent={
            <View
              style={[
                styles.infoNotice,
                {
                  backgroundColor: colors.backgroundMuted,
                  borderRadius: 8,
                  marginBottom: spacing.s,
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text variant="micro" color="secondary" style={styles.infoNoticeText}>
                Reminders are recorded when you add items. Expiry alerts help you eat
                fresh produce in time.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { colors, borders, radius } = theme;

  const isUrgent =
    item.message.toLowerCase().includes("today") ||
    item.message.toLowerCase().includes("urgent");
  const isWarning =
    item.message.toLowerCase().includes("soon") ||
    item.message.toLowerCase().includes("expir");
  const isUnread = !item.sent;

  let stripColor = colors.border;
  let iconName: keyof typeof Ionicons.glyphMap = "checkmark-circle-outline";
  let iconColor = colors.textSecondary;
  let iconBg = colors.backgroundMuted;
  let timeColor = colors.textTertiary;
  let cardBg = colors.surface;

  if (isUrgent && isUnread) {
    stripColor = colors.statusUrgent;
    iconName = "alert-circle";
    iconColor = colors.statusUrgent;
    iconBg = colors.statusUrgentSoft;
    timeColor = colors.statusUrgent;
    cardBg = "#FFF8F7";
  } else if (isWarning && isUnread) {
    stripColor = colors.statusWarning;
    iconName = "time";
    iconColor = colors.statusWarning;
    iconBg = colors.statusWarningSoft;
    timeColor = colors.statusWarning;
    cardBg = "#FFFCF5";
  } else if (item.sent) {
    stripColor = colors.border;
    iconName = "checkmark-circle";
    iconColor = colors.statusSuccess;
    iconBg = colors.statusSuccessSoft;
  }

  // Parse title vs body from message
  const colonIdx = item.message.indexOf(":");
  const title =
    colonIdx > 0 ? item.message.substring(0, colonIdx) : "Inventory alert";
  const body =
    colonIdx > 0 ? item.message.substring(colonIdx + 1).trim() : item.message;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: cardBg,
          borderColor: colors.border,
          borderRadius: radius.card,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* 4px Left Accent Strip */}
      <View
        style={[
          styles.accentStrip,
          {
            backgroundColor: stripColor,
            width: borders.accentStrip,
          },
        ]}
      />

      <View style={styles.cardContent}>
        {/* 40x40 Icon Badge */}
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: iconBg },
          ]}
        >
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        {/* Text Details */}
        <View style={styles.textColumn}>
          <View style={styles.titleRow}>
            <Text
              variant="headline"
              style={[
                styles.itemTitle,
                { color: colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>

            {isUnread && (
              <View
                style={[
                  styles.unreadDot,
                  { backgroundColor: stripColor !== colors.border ? stripColor : colors.statusUrgent },
                ]}
              />
            )}
          </View>

          <Text
            variant="body"
            style={[
              styles.itemBody,
              { color: isUnread ? colors.textPrimary : colors.textSecondary },
            ]}
          >
            {body}
          </Text>

          <Text
            variant="micro"
            style={[
              styles.timeText,
              { color: timeColor, fontWeight: isUnread ? "700" : "500" },
            ]}
          >
            {formatRelativeTime(item.notify_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 4,
  },
  headerTopRow: {
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
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 20,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tabButton: {
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  tabText: {
    fontSize: 14,
  },
  unreadTabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgePillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  infoNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoNoticeText: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
    gap: 10,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    position: "relative",
    borderWidth: 1,
    overflow: "hidden",
  },
  accentStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  cardContent: {
    flexDirection: "row",
    padding: 14,
    paddingLeft: 18,
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  textColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemBody: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
    marginBottom: 6,
  },
  timeText: {
    fontSize: 11,
  },
});
