/**
 * FRESCO — Inventory Screen (Uber Base Design System)
 * Matches Reference Screens:
 * 1. Inventory list with summary pills, filter tabs, left accent strips, large urgency numbers
 * 2. Add to inventory bottom sheet modal
 * 3. Added to inventory success view
 * 4. Empty state with apple icon & compact CTA
 * 5. Error state with warning icon & retry CTA
 */

import { useMemo } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
  type TabKey,
} from "../../components/ui";
import { useInventory } from "../../hooks/useInventory";
import { useNotifications } from "../../hooks/useNotifications";
import { useFridgeStore } from "../../stores/fridgeStore";
import type { InventoryItem } from "../../types/api";

function daysOf(item: InventoryItem): number {
  return item.days_left ?? item.estimated_days_remaining;
}

export default function FridgeScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;

  const filter = useFridgeStore((s) => s.filter);
  const setFilter = useFridgeStore((s) => s.setFilter);

  // Live Inventory Hook
  const inventoryQuery = useInventory();
  const notifications = useNotifications();
  const hasAlerts = (notifications.data?.total ?? 0) > 0;

  // The server response is the only source of truth — no demo fallback, so
  // an empty account shows the real empty state instead of fake produce.
  const allItems: InventoryItem[] = useMemo(
    () => inventoryQuery.data?.items ?? [],
    [inventoryQuery.data],
  );

  // Compute status counts for SummaryPills from the same thresholds the
  // filter tabs use, so pill counts and tab contents always agree.
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

  // Filter items according to the active tab
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const d = daysOf(item);
      if (filter === "eat_first") return d > 0 && d <= 4;
      if (filter === "fresh") return d > 4;
      if (filter === "expired") return d <= 0;
      return true; // "all"
    });
  }, [allItems, filter]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header: Title & Notification Bell */}
        <View
          style={[
            styles.headerRow,
            {
              paddingHorizontal: layout.screenPadding,
              paddingTop: spacing.m,
              paddingBottom: spacing.s,
            },
          ]}
        >
          <Text
            variant="largeTitle"
            style={{
              color: colors.textPrimary,
              fontSize: 30,
              fontWeight: "800",
              letterSpacing: -0.6,
            }}
          >
            Inventory
          </Text>

          {/* Notification Bell — dot only when alerts exist */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hasAlerts ? `Notifications, ${notifications.data?.total ?? 0} alerts` : "Notifications"
            }
            onPress={() => router.push("/notifications")}
            style={styles.bellButton}
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

        {/* Summary Pills */}
        <View style={{ paddingHorizontal: layout.screenPadding, marginBottom: spacing.m }}>
          <SummaryPills
            expiringCount={expiringCount}
            expiredCount={expiredCount}
            freshCount={freshCount}
          />
        </View>

        {/* Filter Tabs */}
        <View style={{ paddingHorizontal: layout.screenPadding, marginBottom: spacing.m }}>
          <FilterTabs
            activeTab={filter as TabKey}
            onTabChange={(key) => setFilter(key)}
          />
        </View>

        {/* Main Content Area */}
        {inventoryQuery.isLoading && allItems.length === 0 ? (
          <Loading fullScreen />
        ) : inventoryQuery.isError && allItems.length === 0 ? (
          <ErrorState
            full
            title="Couldn't load inventory"
            message="Something went wrong while fetching your items."
            retryLabel="Try Again"
            onRetry={() => inventoryQuery.refetch()}
          />
        ) : filteredItems.length === 0 ? (
          allItems.length === 0 ? (
            <EmptyState
              full
              title="No items yet"
              description="Scan a fruit or add one by name to start tracking it."
              actionLabel="Add a fruit"
              onAction={() => router.push("/add-item")}
            />
          ) : (
            <EmptyState
              full
              title="Nothing here"
              description="No items match this filter right now."
              actionLabel="Show all"
              onAction={() => setFilter("all")}
              visual={
                <View
                  style={[
                    styles.filterEmptyIcon,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons name="filter-outline" size={34} color={colors.textPrimary} />
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
              paddingBottom: 100, // Space for FAB & Bottom Nav
              paddingTop: spacing.xs,
              gap: spacing.m,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <InventoryCard
                name={item.fruit.name}
                storage={item.storage_method}
                category={item.fruit.subcategory}
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

        {/* Floating Action Button (FAB) */}
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
    position: "relative",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  filterEmptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPosition: {
    position: "absolute",
    bottom: 24,
    right: 20,
  },
});
