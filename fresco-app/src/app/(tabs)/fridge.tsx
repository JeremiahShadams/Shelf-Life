/**
 * FRESCO — Fridge (Tracked Produce Screen)
 * - Uses react-native-safe-area-context for proper Android & iOS safe-area insets
 * - Tab label, route file, and screen header all agree on "Fridge"
 * - Summary pills filter the list on tap with >= 44pt hit targets
 * - Each InventoryCard renders its captured produce thumbnail
 */

import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import {
  EmptyState,
  ErrorState,
  FAB,
  FilterTabs,
  InventoryCard,
  Loading,
  SummaryPills,
  Text,
  type SummaryPillType,
  type TabKey,
} from "../../components/ui";
import { useInventory } from "../../hooks/useInventory";
import { useNotifications } from "../../hooks/useNotifications";
import { useFridgeStore } from "../../stores/fridgeStore";
import { useAuth } from "../../stores/auth";
import type { InventoryItem } from "../../types/api";

function daysOf(item: InventoryItem): number {
  return item.days_left ?? item.estimated_days_remaining;
}

export default function FridgeScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, borders } = theme;

  const filter = useFridgeStore((s) => s.filter);
  const setFilter = useFridgeStore((s) => s.setFilter);
  const isGuest = useAuth((s) => s.token === "guest_demo_token");

  const inventoryQuery = useInventory();
  const notifications = useNotifications();
  const hasAlerts = (notifications.data?.total ?? 0) > 0;

  const allItems: InventoryItem[] = useMemo(
    () => inventoryQuery.data?.items ?? [],
    [inventoryQuery.data],
  );

  const { expiringCount, expiredCount, freshCount } = useMemo(() => {
    let expiring = 0;
    let expired = 0;
    let fresh = 0;

    for (const item of allItems) {
      const d = daysOf(item);
      if (d <= 0) expired++;
      else if (d <= 4) expiring++;
      else fresh++;
    }

    return { expiringCount: expiring, expiredCount: expired, freshCount: fresh };
  }, [allItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const d = daysOf(item);
      if (filter === "eat_first") return d > 0 && d <= 4;
      if (filter === "fresh") return d > 4;
      if (filter === "expired") return d <= 0;
      return true;
    });
  }, [allItems, filter]);

  const activePillType: SummaryPillType | null =
    filter === "eat_first"
      ? "expiring"
      : filter === "expired"
        ? "expired"
        : filter === "fresh"
          ? "fresh"
          : null;

  const handlePressPill = (type: SummaryPillType) => {
    const mapped: TabKey =
      type === "expiring" ? "eat_first" : type === "expired" ? "expired" : "fresh";
    setFilter(filter === mapped ? "all" : mapped);
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header: agrees 1:1 with "Fridge" tab */}
        <View
          style={[
            styles.headerRow,
            {
              paddingHorizontal: layout.screenPadding,
              paddingTop: spacing.m,
              paddingBottom: spacing.xs,
            },
          ]}
        >
          <Text variant="largeTitle" color="brand">
            Fridge
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hasAlerts ? `Alerts, ${notifications.data?.total ?? 0} active` : "Alerts"
            }
            onPress={() => router.push("/notifications")}
            style={({ pressed }) => [
              styles.bellButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            {hasAlerts && (
              <View
                style={[
                  styles.notificationDot,
                  {
                    backgroundColor: colors.statusUrgent,
                    borderColor: colors.background,
                  },
                ]}
              />
            )}
          </Pressable>
        </View>

        {/* Tappable Summary Pills */}
        <View style={{ paddingHorizontal: layout.screenPadding, marginBottom: spacing.xs }}>
          <SummaryPills
            expiringCount={expiringCount}
            expiredCount={expiredCount}
            freshCount={freshCount}
            activeType={activePillType}
            onPressPill={handlePressPill}
          />
        </View>

        {/* Filter Tabs */}
        <View style={{ paddingHorizontal: layout.screenPadding, marginBottom: spacing.m }}>
          <FilterTabs activeTab={filter as TabKey} onTabChange={(key) => setFilter(key)} />
        </View>

        {/* Guest Mode Local Persistence Notice */}
        {isGuest && (
          <View
            style={[
              styles.guestBanner,
              {
                marginHorizontal: layout.screenPadding,
                marginBottom: spacing.m,
                backgroundColor: colors.backgroundMuted,
                borderColor: colors.border,
                borderWidth: borders.hairline,
                borderRadius: radius.sm + 2,
              },
            ]}
          >
            <Ionicons name="phone-portrait-outline" size={16} color={colors.textSecondary} />
            <Text variant="micro" color="secondary" style={styles.guestText}>
              Guest mode — items stay saved on this device until you sign out. Sign in anytime for cloud backup.
            </Text>
          </View>
        )}

        {/* List / Empty / Error States */}
        {inventoryQuery.isLoading && allItems.length === 0 ? (
          <Loading fullScreen />
        ) : inventoryQuery.isError && allItems.length === 0 ? (
          <ErrorState
            full
            title="Couldn't load your fridge"
            message="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => void inventoryQuery.refetch()}
          />
        ) : filteredItems.length === 0 ? (
          allItems.length === 0 ? (
            <EmptyState
              full
              title="Your fridge is empty"
              description="Scan a produce item or add one by name to start tracking shelf life."
              actionLabel="Add produce"
              onAction={() => router.push("/add-item")}
            />
          ) : (
            <EmptyState
              full
              title="Nothing in this filter"
              description="No tracked items match this freshness stage right now."
              actionLabel="Show all"
              onAction={() => setFilter("all")}
              visual={
                <View
                  style={[
                    styles.filterEmptyIcon,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons name="filter-outline" size={32} color={colors.primary} />
                </View>
              }
            />
          )
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{
              paddingHorizontal: layout.screenPadding,
              paddingBottom: 104,
              paddingTop: spacing.xs,
              gap: spacing.m,
            }}
            showsVerticalScrollIndicator={false}
            refreshing={inventoryQuery.isRefetching}
            onRefresh={() => {
              void inventoryQuery.refetch();
            }}
            renderItem={({ item }) => (
              <InventoryCard
                name={item.fruit.name}
                storage={item.storage_method}
                category={item.fruit.subcategory}
                imagePath={item.image_path}
                quantity={item.quantity}
                daysLeft={daysOf(item)}
                onPress={() =>
                  router.push({
                    pathname: "/inventory/[id]",
                    params: { id: String(item.id) },
                  })
                }
              />
            )}
          />
        )}

        <FAB onPress={() => router.push("/add-item")} style={styles.fabPosition} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bellButton: {
    width: 44,
    height: 44,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
  },
  guestBanner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  guestText: {
    flex: 1,
  },
  filterEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPosition: {
    position: "absolute",
    bottom: 24,
    right: 20,
  },
});
