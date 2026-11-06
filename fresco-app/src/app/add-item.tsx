/**
 * Fresco — Add to inventory (manual)
 * The scanner needs the exported Keras model, so this is the path that
 * always works: search the reference fruit table, pick storage + quantity,
 * then save. Two steps, one primary action each.
 */

import { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Text,
} from "../components/ui";
import { AddedSuccessView, DuplicateItemDialog } from "../components/fridge";
import { useAddToInventory, useInventory, useUpdateInventoryItem } from "../hooks/useInventory";
import { useFruitSearch } from "../hooks/useFruits";
import type { Fruit, InventoryItem, StorageMethod } from "../types/api";

const STORAGE_OPTIONS: { key: StorageMethod; label: string }[] = [
  { key: "room_temp", label: "Counter" },
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Freezer" },
];

const STORAGE_FIELD: Record<StorageMethod, keyof Fruit> = {
  room_temp: "shelf_life_room_temp_days",
  fridge: "shelf_life_fridge_days",
  freezer: "shelf_life_freezer_days",
};

function shelfLifeFor(fruit: Fruit, storage: StorageMethod): number {
  return fruit[STORAGE_FIELD[storage]] as number;
}

export default function AddItemScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, borders } = theme;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<Fruit | null>(null);
  const [storage, setStorage] = useState<StorageMethod>("fridge");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(id);
  }, [query]);

  const fruitsQuery = useFruitSearch(debouncedQuery);
  const inventoryQuery = useInventory();
  const addMutation = useAddToInventory();
  const updateMutation = useUpdateInventoryItem();

  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [existingMatch, setExistingMatch] = useState<InventoryItem | null>(null);

  function chooseFruit(fruit: Fruit) {
    Keyboard.dismiss();
    setSelected(fruit);
    setStorage("fridge");
    setQuantity(1);
    setAddError(null);
  }

  function close() {
    router.back();
  }

  function executeAdd() {
    if (selected == null) return;
    setAddError(null);
    addMutation.mutate(
      {
        fruit_id: selected.id,
        storage_method: storage,
        quantity,
      },
      {
        onSuccess: () => setAdded(true),
        onError: (err) =>
          setAddError(
            err instanceof Error ? err.message : "Couldn't add that item. Try again.",
          ),
      },
    );
  }

  function save() {
    if (selected == null) return;
    const existing = inventoryQuery.data?.items.find(
      (it) => it.fruit_id === selected.id && !it.is_consumed,
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
          quantity: (existingMatch.quantity || 1) + quantity,
        },
      },
      {
        onSuccess: () => {
          setDuplicateModalVisible(false);
          setAdded(true);
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

  function addAnother() {
    setAdded(false);
    setSelected(null);
    setQuery("");
    setDebouncedQuery("");
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { paddingHorizontal: layout.screenPadding }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selected ? "Back to search" : "Close"}
          onPress={() => (selected ? setSelected(null) : close())}
          style={styles.iconButton}
        >
          <Ionicons
            name={selected ? "arrow-back" : "close"}
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>
        <Text variant="title">
          {selected ? "Add to inventory" : "Find a fruit"}
        </Text>
        <View style={styles.iconButton} />
      </View>

      {added && selected != null ? (
        <AddedSuccessView
          itemName={selected.name}
          secondaryLabel="Add another"
          onViewInventory={close}
          onScanAnother={addAnother}
        />
      ) : selected != null ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.screenPadding,
            paddingTop: spacing.m,
            paddingBottom: spacing.xxl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <Text variant="headline">{selected.name}</Text>
            <Text variant="caption" color="secondary" style={{ marginTop: spacing.xxs }}>
              {selected.subcategory} · about {shelfLifeFor(selected, storage)}{" "}
              {shelfLifeFor(selected, storage) === 1 ? "day" : "days"} in{" "}
              {storage === "room_temp" ? "the counter" : storage === "fridge" ? "the fridge" : "the freezer"}
            </Text>
            {(selected.optimal_temp_min != null || selected.optimal_temp_max != null) && (
              <Text variant="micro" color="tertiary" style={{ marginTop: spacing.xs }}>
                Best around {selected.optimal_temp_min ?? "—"}–
                {selected.optimal_temp_max ?? "—"}°C
              </Text>
            )}
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
              const isSelected = storage === option.key;
              return (
                <Button
                  key={option.key}
                  label={option.label}
                  small
                  variant={isSelected ? "primary" : "secondary"}
                  onPress={() => setStorage(option.key)}
                  style={styles.storageButton}
                />
              );
            })}
          </View>

          <View
            style={[
              styles.quantityRow,
              {
                marginTop: spacing.l,
                paddingVertical: spacing.s,
                borderTopWidth: borders.hairline,
                borderBottomWidth: borders.hairline,
                borderColor: colors.border,
              },
            ]}
          >
            <Text variant="body">Quantity</Text>
            <View style={[styles.stepper, { gap: spacing.s }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                disabled={quantity <= 1}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={[
                  styles.stepButton,
                  {
                    borderRadius: radius.input,
                    borderColor: colors.border,
                    borderWidth: borders.hairline,
                    opacity: quantity <= 1 ? 0.4 : 1,
                  },
                ]}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </Pressable>
              <Text variant="title" style={styles.quantityValue}>
                {quantity}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                onPress={() => setQuantity((q) => q + 1)}
                style={[
                  styles.stepButton,
                  {
                    borderRadius: radius.input,
                    borderColor: colors.border,
                    borderWidth: borders.hairline,
                  },
                ]}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {selected.storage_tips != null && selected.storage_tips !== "" && (
            <Card style={{ marginTop: spacing.l }}>
              <Text variant="micro" color="tertiary">
                STORAGE TIP
              </Text>
              <Text
                variant="caption"
                color="secondary"
                style={{ marginTop: spacing.xs }}
              >
                {selected.storage_tips}
              </Text>
            </Card>
          )}

          {(selected.is_ethylene_producer || selected.is_ethylene_sensitive) && (
            <Text
              variant="micro"
              color="tertiary"
              style={{ marginTop: spacing.m }}
            >
              {selected.is_ethylene_producer
                ? "Produces ethylene — keep away from ethylene-sensitive produce."
                : "Sensitive to ethylene — store away from producers like apples and bananas."}
            </Text>
          )}

          {addError != null && (
            <Text variant="caption" color="danger" style={{ marginTop: spacing.m }}>
              {addError}
            </Text>
          )}

          <Button
            label="Add to inventory"
            block
            loading={addMutation.isPending}
            onPress={save}
            style={{ marginTop: spacing.l }}
          />
        </ScrollView>
      ) : (
        <View style={styles.searchStep}>
          <View style={{ paddingHorizontal: layout.screenPadding }}>
            <Input
              placeholder="Search fruits"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {fruitsQuery.isLoading ? (
            <Loading fullScreen />
          ) : fruitsQuery.isError ? (
            <ErrorState
              full
              title="Couldn't load fruits"
              message="Check your connection and try again."
              retryLabel="Try Again"
              onRetry={() => fruitsQuery.refetch()}
            />
          ) : (fruitsQuery.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              full
              title="No matches"
              description="Try a different name — for example 'apple' or 'banana'."
              actionLabel={query.length > 0 ? "Clear search" : undefined}
              onAction={query.length > 0 ? () => setQuery("") : undefined}
              visual={
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons name="search-outline" size={34} color={colors.textPrimary} />
                </View>
              }
            />
          ) : (
            <FlatList
              data={fruitsQuery.data?.items ?? []}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: layout.screenPadding,
                paddingTop: spacing.m,
                paddingBottom: spacing.xxl,
                gap: spacing.s,
              }}
              renderItem={({ item }) => (
                <Card onPress={() => chooseFruit(item)}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text variant="cardTitle">{item.name}</Text>
                      <Text variant="caption" color="secondary">
                        {item.subcategory} · {item.shelf_life_fridge_days} days in the fridge
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </View>
                </Card>
              )}
            />
          )}
        </View>
      )}

      {selected != null && (
        <DuplicateItemDialog
          visible={duplicateModalVisible}
          fruitName={selected.name}
          existingQuantity={existingMatch?.quantity ?? 1}
          newQuantity={quantity}
          loading={updateMutation.isPending || addMutation.isPending}
          onAddToQuantity={handleAddToQuantity}
          onCreateNew={handleCreateNewEntry}
          onCancel={() => setDuplicateModalVisible(false)}
        />
      )}
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
  searchStep: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  storageRow: { flexDirection: "row" },
  storageButton: { flex: 1 },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: { minWidth: 28, textAlign: "center" },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
