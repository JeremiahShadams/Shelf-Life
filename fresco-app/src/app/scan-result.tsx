/**
 * Fresco — Scan result
 * Renders the backend's unified verdict directly (no client-side guessing):
 * status + days, the recommendation, per-storage estimates, and the domain
 * storage tip. One primary action: add to the fridge.
 */

import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { Badge, Button, Card, ErrorState, Text } from "../components/ui";
import { DuplicateItemDialog } from "../components/fridge";
import { useAddToInventory, useInventory, useUpdateInventoryItem } from "../hooks/useInventory";
import type { InventoryItem, ScanResult, StorageMethod } from "../types";

const STORAGE_OPTIONS: { key: StorageMethod; label: string }[] = [
  { key: "room_temp", label: "Counter" },
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Freezer" },
];

const STATUS_LABEL: Record<string, string> = {
  FRESH: "Fresh",
  EAT_SOON: "Eat soon",
  EAT_TODAY: "Eat today",
  SPOILED: "Spoiled",
};

function formatDays(days: number): string {
  if (days <= 0) return "No days left";
  if (days < 1) return "Less than a day";
  const rounded = Math.round(days);
  return `~${rounded} ${rounded === 1 ? "day" : "days"}`;
}

export default function ScanResultScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;
  const params = useLocalSearchParams<{ scan?: string }>();

  const result = useMemo<ScanResult | null>(() => {
    if (!params.scan) return null;
    try {
      return JSON.parse(params.scan) as ScanResult;
    } catch {
      return null;
    }
  }, [params.scan]);

  const inventoryQuery = useInventory();
  const addToFridge = useAddToInventory();
  const updateMutation = useUpdateInventoryItem();
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [existingMatch, setExistingMatch] = useState<InventoryItem | null>(null);

  const [storageMethod, setStorageMethod] = useState<StorageMethod>(
    result?.best_storage ?? "fridge",
  );
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  if (result == null) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          full
          message="This scan result is no longer available. Scan the item again."
          retryLabel="Go back"
          onRetry={() => router.back()}
        />
      </View>
    );
  }

  const selectedDays = result.estimated_shelf_life[storageMethod];
  const statusLabel = STATUS_LABEL[result.status] ?? result.status;

  function executeAdd() {
    setAddError(null);
    addToFridge.mutate(
      {
        fruit_id: result!.fruit.id,
        freshness_score: result!.freshness_score,
        storage_method: storageMethod,
        quantity: 1,
        image_path: result!.image_path ?? undefined,
      },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => router.back(), 800);
        },
        onError: (err) => {
          setAddError(err instanceof Error ? err.message : "Couldn't add that item. Try again.");
        },
      },
    );
  }

  function handleAdd() {
    if (result == null) return;
    const existing = inventoryQuery.data?.items.find(
      (it) => it.fruit_id === result.fruit.id && !it.is_consumed,
    );
    if (existing) {
      setExistingMatch(existing);
      setDuplicateModalVisible(true);
      return;
    }
    executeAdd();
  }

  function handleAddToQuantity() {
    if (!existingMatch) return;
    setAddError(null);
    updateMutation.mutate(
      {
        itemId: existingMatch.id,
        update: {
          quantity: (existingMatch.quantity || 1) + 1,
        },
      },
      {
        onSuccess: () => {
          setDuplicateModalVisible(false);
          setAdded(true);
          setTimeout(() => router.back(), 800);
        },
        onError: (err) => {
          setAddError(
            err instanceof Error ? err.message : "Couldn't update quantity. Try again.",
          );
        },
      },
    );
  }

  function handleCreateNewEntry() {
    setDuplicateModalVisible(false);
    executeAdd();
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.l,
          paddingBottom: spacing.xxl,
        }}
      >
        <View style={styles.topBar}>
          <Text variant="micro" color="tertiary">
            SCAN RESULT
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text variant="largeTitle" style={{ marginTop: spacing.s }}>
          {result.fruit.name}
        </Text>
        <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
          {result.freshness_label} · {Math.round(result.classification_confidence * 100)}% sure
        </Text>

        <Card floating style={{ marginTop: spacing.l }}>
          <View style={styles.verdictRow}>
            <Badge label={statusLabel} daysLeft={result.days_left} />
            <Text variant="title">{formatDays(result.days_left)}</Text>
          </View>

          <Text variant="body" color="secondary" style={{ marginTop: spacing.m }}>
            {result.recommendation}
          </Text>
        </Card>

        <Text
          variant="micro"
          color="tertiary"
          style={{ marginTop: spacing.l, marginBottom: spacing.s }}
        >
          STORE IN
        </Text>

        <View style={[styles.storageRow, { gap: spacing.s }]}>
          {STORAGE_OPTIONS.map((option) => {
            const available = result.estimated_shelf_life[option.key] != null;
            const selected = storageMethod === option.key;

            return (
              <Button
                key={option.key}
                label={option.label}
                small
                variant={selected ? "secondary" : "ghost"}
                disabled={!available}
                onPress={() => setStorageMethod(option.key)}
                style={[
                  styles.storageButton,
                  !selected && { opacity: 0.55 },
                ]}
              />
            );
          })}
        </View>

        {selectedDays != null && (
          <Text variant="caption" color="secondary" style={{ marginTop: spacing.s }}>
            {formatDays(selectedDays)} in the{" "}
            {storageMethod === "room_temp"
              ? "counter"
              : storageMethod === "fridge"
                ? "fridge"
                : "freezer"}
            {storageMethod === result.best_storage ? " · recommended" : ""}
          </Text>
        )}

        {result.storage_tip !== "" && (
          <Card style={{ marginTop: spacing.l }}>
            <Text variant="micro" color="tertiary">
              STORAGE TIP
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
              {result.storage_tip}
            </Text>
          </Card>
        )}

        {result.ethylene_note != null && (
          <Text variant="micro" color="tertiary" style={{ marginTop: spacing.m }}>
            {result.ethylene_note}
          </Text>
        )}

        {addError != null && (
          <Text variant="caption" color="danger" style={{ marginTop: spacing.m }}>
            {addError}
          </Text>
        )}

        <Button
          label={added ? "Added to fridge" : "Add to fridge"}
          block
          loading={addToFridge.isPending}
          disabled={added}
          onPress={handleAdd}
          style={{ marginTop: spacing.l }}
        />
      </ScrollView>

      {result != null && (
        <DuplicateItemDialog
          visible={duplicateModalVisible}
          fruitName={result.fruit.name}
          existingQuantity={existingMatch?.quantity ?? 1}
          newQuantity={1}
          loading={updateMutation.isPending || addToFridge.isPending}
          onAddToQuantity={handleAddToQuantity}
          onCreateNew={handleCreateNewEntry}
          onCancel={() => setDuplicateModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  verdictRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  storageRow: { flexDirection: "row" },
  storageButton: { flex: 1 },
});
