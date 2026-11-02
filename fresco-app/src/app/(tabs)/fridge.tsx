/**
 * Fresco — My Fridge Screen
 * Urgency-sorted inventory tracker with filter pills,
 * days-left badges, pull-to-refresh, and quick-consume actions.
 */

import { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Text, Card, Badge, Loading, ErrorState, EmptyState } from "../../components/ui";
import { useFridgeStore, type FridgeFilter } from "../../stores/fridgeStore";

export default function FridgeScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;
  const { items, filter, setFilter, isLoading, error, fetchInventory, markConsumed, removeItem } =
    useFridgeStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (item.is_consumed) return false;
    if (filter === "eat_first") return item.days_left <= 3;
    if (filter === "fresh") return item.days_left > 3;
    return true;
  });

  const filterTabs: { label: string; value: FridgeFilter }[] = [
    { label: "Eat First", value: "eat_first" },
    { label: "Fresh", value: "fresh" },
    { label: "All Items", value: "all" },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xxl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text variant="largeTitle">My Fridge</Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              {items.filter((i) => !i.is_consumed).length} items tracked
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={[styles.filterBar, { marginVertical: spacing.m }]}>
          {filterTabs.map((tab) => {
            const isActive = filter === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setFilter(tab.value)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: isActive
                      ? theme.dark
                        ? colors.background
                        : "#FFFFFF"
                      : colors.textSecondary,
                    fontWeight: isActive ? "600" : "400",
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Content States */}
        {isLoading && !refreshing ? (
          <Loading style={{ paddingVertical: spacing.xxl }} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchInventory} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={
              filter === "eat_first"
                ? "No urgent items"
                : filter === "fresh"
                  ? "No fresh items"
                  : "Your fridge is empty"
            }
            description="Scan food with your camera or add groceries to track expiry."
            actionLabel={filter === "all" ? "Scan Food" : undefined}
          />
        ) : (
          <View style={{ gap: spacing.s }}>
            {filteredItems.map((item) => {
              const label =
                item.days_left <= 0
                  ? "Expired"
                  : item.days_left <= 1
                    ? "Eat Today"
                    : `${Math.round(item.days_left)} days left`;

              return (
                <Card key={item.id} style={styles.itemCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.itemNameRow}>
                      <Text variant="headline">{item.fruit.name}</Text>
                      <Badge daysLeft={item.days_left} label={label} />
                    </View>
                    <Text variant="micro" color="secondary" style={{ marginTop: 4 }}>
                      Qty: {item.quantity} • Stored: {item.storage_method.replace("_", " ")}
                    </Text>
                    {item.fruit.storage_tips && (
                      <Text
                        variant="micro"
                        color="tertiary"
                        numberOfLines={1}
                        style={{ marginTop: 2 }}
                      >
                        Tip: {item.fruit.storage_tips}
                      </Text>
                    )}
                  </View>

                  <View style={styles.actionButtons}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Mark finished"
                      onPress={() => markConsumed(item.id)}
                      style={({ pressed }) => [
                        styles.iconBtn,
                        { backgroundColor: colors.surfacePressed, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Ionicons name="checkmark" size={18} color={colors.accent} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove item"
                      onPress={() => removeItem(item.id)}
                      style={({ pressed }) => [
                        styles.iconBtn,
                        { backgroundColor: colors.surfacePressed, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
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
  headerRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterBar: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
