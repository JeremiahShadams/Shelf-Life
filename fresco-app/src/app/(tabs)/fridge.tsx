/**
 * Fresco — Fridge tab
 * The inventory list. Truth rules:
 *   - days/status come from the server's live fields (days_left), never
 *     the at-scan snapshot (estimated_days_remaining)
 *   - the ONLY semantic colors are days-left badges (Badge enforces the
 *     law: >4 calm / 2–4 warning / 0–1 danger)
 *   - every state exists: loading, error (with retry), empty, content
 */

import { FlatList, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../../theme";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  Text,
} from "../../components/ui";
import { useFridgeStore, type FridgeFilter } from "../../stores/fridgeStore";
import {
  useDeleteInventoryItem,
  useInventory,
  useUpdateInventoryItem,
} from "../../hooks/useInventory";
import type { InventoryItem } from "../../types/api";

const FILTERS: { key: FridgeFilter; label: string }[] = [
  { key: "eat_first", label: "Eat first" },
  { key: "all", label: "Everything" },
  { key: "fresh", label: "Well within date" },
];

function daysOf(item: InventoryItem): number {
  return item.days_left ?? item.estimated_days_remaining;
}

function sortAndFilter(items: InventoryItem[], filter: FridgeFilter): InventoryItem[] {
  const sorted = [...items].sort((a, b) => daysOf(a) - daysOf(b));
  if (filter === "eat_first") return sorted.filter((i) => daysOf(i) <= 4);
  if (filter === "fresh") return sorted.filter((i) => daysOf(i) > 4);
  return sorted;
}

function ItemRow({ item }: { item: InventoryItem }) {
  const theme = useTheme();
  const { spacing } = theme;
  const markConsumed = useUpdateInventoryItem();
  const removeItem = useDeleteInventoryItem();

  const daysLeft = daysOf(item);
  const dayText =
    daysLeft <= 0
      ? "Expired"
      : `~${Math.round(daysLeft)} ${Math.round(daysLeft) === 1 ? "day" : "days"} left`;

  return (
    <Card style={{ marginBottom: spacing.m }} floating>
      <View style={[styles.row, { gap: spacing.s }]}>
        <View style={styles.rowMain}>
          <View style={styles.rowTitle}>
            <Text variant="headline">{item.fruit.name}</Text>
            {item.quantity > 1 && (
              <Text variant="micro" color="tertiary">
                {" \u00D7"} {item.quantity}
              </Text>
            )}
          </View>
          <Text variant="micro" color="tertiary">
            {item.fruit.subcategory === "other" ? "" : `${item.fruit.subcategory} · `}
            {item.storage_method === "room_temp"
              ? "Counter"
              : item.storage_method === "fridge"
                ? "Fridge"
                : "Freezer"}
            {" · "}
            {dayText}
          </Text>
        </View>
        <Badge label={item.status ?? "FRESH"} daysLeft={daysLeft} />
      </View>
      <View style={[styles.rowActions, { gap: spacing.xs, marginTop: spacing.s }]}>
        <Button
          label="Eaten"
          variant="ghost"
          small
          disabled={item.is_consumed}
          onPress={() => markConsumed.mutate({ itemId: item.id, update: { is_consumed: true } })}
        />
        <Button
          label="Remove"
          variant="ghost"
          small
          disabled={removeItem.isPending}
          onPress={() => removeItem.mutate(item.id)}
        />
      </View>
    </Card>
  );
}

export default function FridgeScreen() {
  const theme = useTheme();
  const { spacing, layout, colors } = theme;

  const filter = useFridgeStore((s) => s.filter);
  const setFilter = useFridgeStore((s) => s.setFilter);
  const inventory = useInventory();

  if (inventory.isLoading) {
    return <Loading fullScreen style={{ backgroundColor: colors.background }} />;
  }

  if (inventory.isError) {
    return (
      <ErrorState
        message={inventory.error instanceof Error ? inventory.error.message : undefined}
        full
        style={{ backgroundColor: colors.background }}
        onRetry={() => inventory.refetch()}
      />
    );
  }

  if (inventory.data == null) {
    return <Loading fullScreen style={{ backgroundColor: colors.background }} />;
  }

  const data = inventory.data;

  if (data.total === 0) {
    return (
      <EmptyState
        full
        title="Your fridge is empty"
        description="Scan an item and it will show up here, with days left counted in real time."
        actionLabel="Scan an item"
        onAction={() => router.navigate("/")}
        style={{ backgroundColor: colors.background }}
      />
    );
  }

  const visible = sortAndFilter(data.items, filter);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: layout.screenPadding, paddingTop: spacing.xl }}>
        <Text variant="largeTitle">Fridge</Text>
        <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
          {data.expiring_soon > 0
            ? `${data.expiring_soon} ${data.expiring_soon === 1 ? "item" : "items"} want eating soon`
            : "Nothing needs urgent attention"}
        </Text>
      </View>

      <View style={[styles.filters, { paddingHorizontal: layout.screenPadding, gap: spacing.s, marginTop: spacing.m }]}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Button
              key={f.key}
              label={f.label}
              small
              variant={active ? "secondary" : "ghost"}
              onPress={() => setFilter(f.key)}
              style={[styles.filterButton, !active && { opacity: 0.55 }]}
            />
          );
        })}
      </View>

      {visible.length === 0 ? (
        <EmptyState
          full
          title="Nothing in this view"
          description="Try switching the filter, or scan something new."
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{
            paddingHorizontal: layout.screenPadding,
            paddingBottom: spacing.xxl,
            paddingTop: spacing.m,
          }}
          renderItem={({ item }) => <ItemRow item={item} />}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  filters: {
    flexDirection: "row",
  },
  filterButton: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  rowActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
