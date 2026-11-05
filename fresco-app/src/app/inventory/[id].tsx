/**
 * Fresco — Inventory item detail
 * One item, its live verdict, and the two things a user actually does from
 * here: move it to another storage method (recalculates the deadline without
 * resetting elapsed time) or take it out (eaten / discarded).
 */

import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Badge, Button, Card, ErrorState, Loading, Text } from "../../components/ui";
import {
  useDeleteInventoryItem,
  useInventoryItem,
  useUpdateInventoryItem,
} from "../../hooks/useInventory";
import type { ItemStatus, StorageMethod } from "../../types/api";

const STORAGE_OPTIONS: { key: StorageMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "room_temp", label: "Counter", icon: "sunny-outline" },
  { key: "fridge", label: "Fridge", icon: "snow-outline" },
  { key: "freezer", label: "Freezer", icon: "cube-outline" },
];

const STATUS_LABEL: Record<ItemStatus, string> = {
  FRESH: "Fresh",
  EAT_SOON: "Eat soon",
  EAT_TODAY: "Eat today",
  SPOILED: "Spoiled",
};

const STORAGE_LABEL: Record<StorageMethod, string> = {
  room_temp: "Counter",
  fridge: "Fridge",
  freezer: "Freezer",
};

function formatDays(days: number): string {
  if (days <= 0) return "No days left";
  const rounded = Math.round(days);
  return `~${rounded} ${rounded === 1 ? "day" : "days"} left`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function InventoryItemScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, borders } = theme;
  const params = useLocalSearchParams<{ id?: string }>();
  const itemId = Number(params.id);

  const itemQuery = useInventoryItem(Number.isFinite(itemId) ? itemId : null);
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const [actionError, setActionError] = useState<string | null>(null);

  if (itemQuery.isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Loading fullScreen />
      </SafeAreaView>
    );
  }

  if (itemQuery.isError || itemQuery.data == null) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          full
          title="Item not found"
          message="It may have been removed. Go back and refresh your inventory."
          retryLabel="Go back"
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const item = itemQuery.data;
  const daysLeft = item.days_left ?? item.estimated_days_remaining;
  const status = item.status ?? "FRESH";

  function changeStorage(storage: StorageMethod) {
    if (storage === item.storage_method) return;
    setActionError(null);
    updateItem.mutate(
      { itemId: item.id, update: { storage_method: storage } },
      {
        onError: (err) =>
          setActionError(
            err instanceof Error ? err.message : "Couldn't update storage. Try again.",
          ),
      },
    );
  }

  function markEaten() {
    setActionError(null);
    updateItem.mutate(
      { itemId: item.id, update: { is_consumed: true } },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          setActionError(
            err instanceof Error ? err.message : "Couldn't mark that item. Try again.",
          ),
      },
    );
  }

  function confirmRemove() {
    Alert.alert("Remove item?", `${item.fruit.name} will be deleted from your inventory.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setActionError(null);
          deleteItem.mutate(item.id, {
            onSuccess: () => router.back(),
            onError: (err) =>
              setActionError(
                err instanceof Error ? err.message : "Couldn't remove that item. Try again.",
              ),
          });
        },
      },
    ]);
  }

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
        <Text variant="title">Item</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.m,
          paddingBottom: spacing.xxl,
        }}
      >
        <Text variant="largeTitle">{item.fruit.name}</Text>
        <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
          {item.fruit.subcategory} · {item.quantity}{" "}
          {item.quantity === 1 ? "item" : "items"}
        </Text>

        <Card floating style={{ marginTop: spacing.l }}>
          <View style={styles.verdictRow}>
            <Badge label={STATUS_LABEL[status]} daysLeft={daysLeft} />
            <Text variant="title">{formatDays(daysLeft)}</Text>
          </View>
          <Text variant="caption" color="secondary" style={{ marginTop: spacing.m }}>
            Estimated expiry {formatDate(item.estimated_expiry)} · added{" "}
            {formatDate(item.scanned_at)}
          </Text>
        </Card>

        <Text
          variant="micro"
          color="tertiary"
          style={{ marginTop: spacing.l, marginBottom: spacing.s }}
        >
          STORED IN
        </Text>
        <View style={[styles.storageRow, { gap: spacing.s }]}>
          {STORAGE_OPTIONS.map((option) => {
            const isSelected = item.storage_method === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                disabled={updateItem.isPending}
                onPress={() => changeStorage(option.key)}
                style={[
                  styles.storageOption,
                  {
                    borderRadius: radius.card,
                    borderWidth: isSelected ? 0 : borders.hairline,
                    borderColor: colors.border,
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    opacity: updateItem.isPending ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={isSelected ? colors.primaryText : colors.textSecondary}
                />
                <Text
                  variant="caption"
                  style={{
                    marginTop: spacing.xxs,
                    color: isSelected ? colors.primaryText : colors.textPrimary,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="caption" color="secondary" style={{ marginTop: spacing.s }}>
          Moving storage recalculates the deadline from the time this item has
          already spent — it won&apos;t restart the clock.
        </Text>

        {actionError != null && (
          <Text variant="caption" color="danger" style={{ marginTop: spacing.m }}>
            {actionError}
          </Text>
        )}

        <Button
          label="Mark as eaten"
          block
          loading={updateItem.isPending}
          onPress={markEaten}
          style={{ marginTop: spacing.xl }}
        />

        <Button
          label="Remove from inventory"
          variant="ghost"
          block
          loading={deleteItem.isPending}
          onPress={confirmRemove}
          style={{ marginTop: spacing.s }}
        />

        <Text variant="micro" color="tertiary" style={{ marginTop: spacing.l }}>
          Currently stored in {STORAGE_LABEL[item.storage_method]}
        </Text>
      </ScrollView>
    </SafeAreaView>
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
  verdictRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  storageRow: { flexDirection: "row" },
  storageOption: {
    flex: 1,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
});
