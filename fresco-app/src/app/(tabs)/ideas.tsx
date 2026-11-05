/**
 * Fresco — Ideas tab
 * Two genuinely useful answers from data we already have:
 *   1. What to use first (inventory sorted by live days left).
 *   2. What should not be stored together (ethylene compatibility).
 * No invented recipes — the backend has no recipe source yet.
 */

import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Loading,
  Text,
} from "../../components/ui";
import { useInventory } from "../../hooks/useInventory";
import { useCompatibility } from "../../hooks/useFruits";
import type { InventoryItem } from "../../types/api";

function daysOf(item: InventoryItem): number {
  return item.days_left ?? item.estimated_days_remaining;
}

export default function IdeasScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;

  const inventory = useInventory();
  const items = useMemo(() => inventory.data?.items ?? [], [inventory.data]);

  const useFirst = useMemo(
    () => [...items].sort((a, b) => daysOf(a) - daysOf(b)).slice(0, 5),
    [items],
  );

  const fruitNames = useMemo(() => items.map((item) => item.fruit.name), [items]);
  const compatibility = useCompatibility(fruitNames);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
      >
        <Text variant="largeTitle">Ideas</Text>
        <Text variant="body" color="secondary" style={{ marginTop: spacing.xs }}>
          What to use first, and what not to store together.
        </Text>

        <Text
          variant="micro"
          color="tertiary"
          style={{ marginTop: spacing.xl, marginBottom: spacing.s }}
        >
          USE FIRST
        </Text>

        {inventory.isLoading ? (
          <Loading />
        ) : inventory.isError ? (
          <Card>
            <Text variant="body">Couldn&apos;t load your inventory.</Text>
            <Button
              label="Try again"
              variant="secondary"
              small
              onPress={() => inventory.refetch()}
              style={{ marginTop: spacing.s }}
            />
          </Card>
        ) : useFirst.length === 0 ? (
          <EmptyState
            title="Nothing to plan yet"
            description="Add a few items and Fresco will tell you what to eat first."
            actionLabel="Add a fruit"
            onAction={() => router.push("/add-item")}
            style={{ paddingHorizontal: 0 }}
          />
        ) : (
          <View style={{ gap: spacing.s }}>
            {useFirst.map((item) => {
              const days = daysOf(item);
              return (
                <Card
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: "/inventory/[id]",
                      params: { id: String(item.id) },
                    })
                  }
                >
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text variant="cardTitle">{item.fruit.name}</Text>
                      <Text variant="caption" color="secondary">
                        {item.quantity} {item.quantity === 1 ? "item" : "items"} ·{" "}
                        {item.storage_method === "room_temp"
                          ? "counter"
                          : item.storage_method}
                      </Text>
                    </View>
                    <Badge
                      label={
                        days <= 0
                          ? "Expired"
                          : days === 1
                            ? "1 day"
                            : `${Math.round(days)} days`
                      }
                      daysLeft={days}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <Text
          variant="micro"
          color="tertiary"
          style={{ marginTop: spacing.xl, marginBottom: spacing.s }}
        >
          STORAGE CHECK
        </Text>

        {fruitNames.length < 2 ? (
          <Card>
            <View style={[styles.row, { gap: spacing.s }]}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={colors.textSecondary}
              />
              <Text variant="caption" color="secondary" style={{ flex: 1 }}>
                Add at least two different fruits to check whether they can share
                the same drawer.
              </Text>
            </View>
          </Card>
        ) : compatibility.isLoading ? (
          <Loading />
        ) : compatibility.isError ? (
          <Card>
            <Text variant="body">Couldn&apos;t check storage compatibility.</Text>
            <Button
              label="Try again"
              variant="secondary"
              small
              onPress={() => compatibility.refetch()}
              style={{ marginTop: spacing.s }}
            />
          </Card>
        ) : (
          <Card>
            {(compatibility.data?.incompatible_pairs.length ?? 0) === 0 ? (
              <View style={[styles.row, { gap: spacing.s }]}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={colors.statusSuccess}
                />
                <Text variant="body" style={{ flex: 1 }}>
                  No ethylene conflicts in your inventory.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.m }}>
                {compatibility.data?.incompatible_pairs.map((pair) => (
                  <View
                    key={`${pair.producer}-${pair.sensitive}`}
                    style={[styles.row, { gap: spacing.s, alignItems: "flex-start" }]}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={22}
                      color={colors.statusWarning}
                    />
                    <Text variant="caption" style={{ flex: 1 }}>
                      {pair.warning}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {(compatibility.data?.recommendation ?? "") !== "" && (
              <Text
                variant="caption"
                color="secondary"
                style={{ marginTop: spacing.m }}
              >
                {compatibility.data?.recommendation}
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
});
