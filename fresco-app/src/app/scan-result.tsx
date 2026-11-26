/**
 * FRESCO — Scan Result Screen (Verdict Ledger)
 * - Dynamic "Best choice" storage highlight strictly matching result.best_storage
 *   (Counter / Fridge / Freezer — never hardcoded to Fridge!)
 * - Visible <60% confidence gate prompting users to retake instead of trusting guesses
 * - Plain-language ethylene gas explainers
 * - Shared offline-safe image resolver (zero external Unsplash dependency)
 * - Haptic confirmation on save & >= 44x44pt navigation hit targets
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { Badge, Button, ErrorState, Text } from "../components/ui";
import { DuplicateItemDialog } from "../components/fridge";
import {
  useAddToInventory,
  useInventory,
  useUpdateInventoryItem,
} from "../hooks/useInventory";
import { hapticLight, hapticSuccess } from "../utils/haptics";
import { resolveItemImageSource } from "../utils/images";
import type { InventoryItem, ScanResult, StorageMethod } from "../types";

type StorageOption = {
  method: StorageMethod;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  daysText: string;
  rawDays: number;
};

export default function ScanResultScreen() {
  const theme = useTheme();
  const { colors, layout, radius, elevation } = theme;
  const insets = useSafeAreaInsets();
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

  const [selectedStorage, setSelectedStorage] = useState<StorageMethod>(
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

  const daysLeft = result.days_left ?? 1;
  const dayDisplayNumber = Math.max(0, Math.round(daysLeft));

  let badgeStatus: "success" | "warning" | "urgent" | "expired" = "success";
  let statusText = "Fresh";
  let statusColor = colors.statusSuccess;

  if (daysLeft <= 0 || result.status === "SPOILED") {
    badgeStatus = "expired";
    statusText = "Spoiled";
    statusColor = colors.statusUrgent;
  } else if (daysLeft <= 1 || result.status === "EAT_TODAY") {
    badgeStatus = "urgent";
    statusText = "Eat Today";
    statusColor = colors.statusUrgent;
  } else if (daysLeft <= 4 || result.status === "EAT_SOON") {
    badgeStatus = "warning";
    statusText = "Eat Soon";
    statusColor = colors.statusWarning;
  }

  const rawClassConf = result.classification_confidence ?? result.confidence ?? 1;
  const lowConfidence = rawClassConf < 0.6;
  const classPercent = Math.round(rawClassConf * 100);
  const freshPercent = Math.round((result.freshness_score ?? 0.8) * 100);

  const counterDays = result.estimated_shelf_life?.room_temp ?? 1;
  const fridgeDays = result.estimated_shelf_life?.fridge ?? 3;
  const freezerDays = result.estimated_shelf_life?.freezer ?? 90;

  const formatDays = (days: number) => `${days} ${days === 1 ? "day" : "days"}`;
  const formatFreezerDays = (days: number) =>
    days >= 30 ? `Up to ${Math.round(days / 30)} mo` : formatDays(days);

  const storageOptions: StorageOption[] = [
    {
      method: "room_temp",
      label: "Counter",
      icon: "sunny-outline",
      daysText: formatDays(counterDays),
      rawDays: counterDays,
    },
    {
      method: "fridge",
      label: "Fridge",
      icon: "snow-outline",
      daysText: formatDays(fridgeDays),
      rawDays: fridgeDays,
    },
    {
      method: "freezer",
      label: "Freezer",
      icon: "cube-outline",
      daysText: formatFreezerDays(freezerDays),
      rawDays: freezerDays,
    },
  ];

  const bestStorage: StorageMethod = result.best_storage ?? "fridge";

  function executeAdd() {
    setAddError(null);
    addToFridge.mutate(
      {
        fruit_id: result!.fruit.id,
        freshness_score: result!.freshness_score,
        storage_method: selectedStorage,
        quantity: 1,
        image_path: result!.image_path ?? undefined,
      },
      {
        onSuccess: () => {
          void hapticSuccess();
          setAdded(true);
          setTimeout(() => router.back(), 750);
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
          void hapticSuccess();
          setDuplicateModalVisible(false);
          setAdded(true);
          setTimeout(() => router.back(), 750);
        },
        onError: (err) => {
          setAddError(err instanceof Error ? err.message : "Couldn't update quantity. Try again.");
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
      <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to scanner"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.floatingBackBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 132 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroBanner, { backgroundColor: colors.backgroundMuted }]}>
          <Image
            source={resolveItemImageSource(
              result.image_path,
              result.fruit.subcategory ?? result.fruit.name,
            )}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
        </View>

        <View style={[styles.verdictCardWrapper, { paddingHorizontal: layout.screenPadding }]}>
          <View
            style={[
              styles.verdictCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.modal,
                borderColor: lowConfidence ? colors.statusWarning : colors.border,
                ...elevation.modal,
              },
            ]}
          >
            <Badge label={statusText} status={badgeStatus} showDot style={styles.statusPillMargin} />

            <Text variant="headline" color="primary" align="center" style={styles.fruitName}>
              {result.fruit.name}
            </Text>
            <Text variant="micro" color="secondary" style={styles.subcategory}>
              {result.fruit.subcategory || "Produce"}
            </Text>

            {lowConfidence && (
              <View
                style={[
                  styles.lowConfBanner,
                  {
                    backgroundColor: colors.statusWarningSoft,
                    borderColor: colors.statusWarning,
                    borderRadius: radius.card,
                  },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={18} color={colors.statusWarning} />
                <Text variant="caption" color="primary" style={styles.lowConfText}>
                  Low confidence match ({classPercent}%). Hold one item closer in good light and retake before saving.
                </Text>
              </View>
            )}

            <View style={styles.urgencyRow}>
              <Text variant="statusHuge" style={{ color: statusColor }}>
                {dayDisplayNumber}
              </Text>
            </View>
            <Text variant="label" style={[styles.urgencyUnitLabel, { color: statusColor }]}>
              {dayDisplayNumber === 1 ? "Day left" : "Days left"}
            </Text>

            <Text variant="caption" color="secondary" align="center" style={styles.recommendationText}>
              {result.recommendation ||
                `Use this ${result.fruit.name} soon for peak flavor and nutrition.`}
            </Text>

            <Text variant="micro" color="tertiary">
              Match certainty {classPercent}%, freshness {freshPercent}%
            </Text>
          </View>
        </View>

        <View style={[styles.detailsSection, { paddingHorizontal: layout.screenPadding }]}>
          {addError != null && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.dangerSoft, borderRadius: radius.card },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color={colors.statusUrgent} />
              <Text variant="caption" color="danger" style={styles.errorText}>
                {addError}
              </Text>
            </View>
          )}

          {/* Dynamic Shelf Life by Storage Table */}
          <View
            style={[
              styles.shelfLifeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.card,
              },
            ]}
          >
            <View
              style={[
                styles.shelfLifeHeader,
                {
                  backgroundColor: colors.backgroundMuted,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text variant="bodyStrong" color="primary">
                Shelf life by storage
              </Text>
              <Text variant="micro" color="tertiary">
                Tap where you plan to store it
              </Text>
            </View>

            {storageOptions.map((option, index) => {
              const isBest = option.method === bestStorage;
              const isSelected = option.method === selectedStorage;
              const isLast = index === storageOptions.length - 1;

              return (
                <Pressable
                  key={option.method}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => {
                    void hapticLight();
                    setSelectedStorage(option.method);
                  }}
                  style={[
                    styles.storageRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    isSelected && {
                      backgroundColor: isBest ? colors.statusSuccessSoft : colors.backgroundMuted,
                    },
                    !isSelected && isBest && { backgroundColor: colors.secondaryAction },
                  ]}
                >
                  {isBest && (
                    <View
                      style={[
                        styles.recomLeftAccent,
                        { backgroundColor: colors.statusSuccess },
                      ]}
                    />
                  )}

                  <View style={styles.storageLeft}>
                    <View
                      style={[
                        styles.storageIconCircle,
                        { backgroundColor: isBest ? colors.surface : colors.backgroundMuted },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={18}
                        color={isBest || isSelected ? colors.primary : colors.textSecondary}
                      />
                    </View>

                    <View style={styles.recomCol}>
                      <View style={styles.storageTitleRow}>
                        <Text variant="bodyStrong" color="primary">
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                        )}
                      </View>
                      {isBest && (
                        <Text variant="micro" color="success" style={styles.bestLabel}>
                          Recommended
                        </Text>
                      )}
                    </View>
                  </View>

                  <Text
                    variant="bodyStrong"
                    color={
                      option.rawDays <= 1
                        ? "danger"
                        : isBest
                          ? "success"
                          : "primary"
                    }
                  >
                    {option.daysText}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {result.storage_tip && (
            <View
              style={[
                styles.tipCard,
                {
                  backgroundColor: colors.backgroundMuted,
                  borderRadius: radius.card,
                },
              ]}
            >
              <Ionicons name="bulb-outline" size={22} color={colors.statusWarning} style={styles.tipIcon} />
              <View style={styles.tipTextCol}>
                <Text variant="bodyStrong" color="primary" style={styles.tipHeading}>
                  Storage tip
                </Text>
                <Text variant="caption" color="secondary">
                  {result.storage_tip}
                </Text>
              </View>
            </View>
          )}

          {(result.ethylene_note != null ||
            result.fruit.is_ethylene_sensitive ||
            result.fruit.is_ethylene_producer) && (
            <View
              style={[
                styles.ethyleneCard,
                {
                  backgroundColor: colors.statusWarningSoft,
                  borderColor: colors.borderStrong,
                  borderRadius: radius.card,
                },
              ]}
            >
              <Ionicons name="warning-outline" size={22} color={colors.statusWarning} style={styles.tipIcon} />
              <View style={styles.tipTextCol}>
                <Text variant="bodyStrong" color="warning" style={styles.ethyleneHeading}>
                  {result.fruit.is_ethylene_producer
                    ? "Releases ripening gas"
                    : "Sensitive to ripening gas"}
                </Text>
                <Text variant="micro" color="secondary" style={styles.jargonExplainer}>
                  {result.fruit.is_ethylene_producer
                    ? "Ethylene producer — releases natural gas that speeds up ripening and spoilage in nearby produce."
                    : "Ethylene sensitive — spoils faster when stored near bananas, apples, or avocados."}
                </Text>
                <Text variant="caption" color="primary">
                  {result.ethylene_note ||
                    (result.fruit.is_ethylene_producer
                      ? `Store ${result.fruit.name} away from leafy greens, berries, and tomatoes.`
                      : `Keep ${result.fruit.name} separate from ripening apples, bananas, and avocados.`)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dual Fixed Bottom Action Bar */}
      <View
        style={[
          styles.fixedActionBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 20),
            ...elevation.modal,
          },
        ]}
      >
        <View style={styles.actionsRow}>
          <Button
            label={lowConfidence ? "Retake Photo" : "Scan Again"}
            variant={lowConfidence ? "accent" : "secondary"}
            onPress={() => router.back()}
            style={lowConfidence ? styles.addInventoryBtn : styles.scanAgainBtn}
          />

          <Button
            label={added ? "Added to Fridge" : lowConfidence ? "Save Anyway" : "Add to Fridge"}
            variant={lowConfidence ? "secondary" : "accent"}
            loading={addToFridge.isPending}
            disabled={added}
            onPress={handleAdd}
            style={lowConfidence ? styles.scanAgainBtn : styles.addInventoryBtn}
          />
        </View>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  floatingHeader: {
    position: "absolute",
    left: 16,
    zIndex: 30,
  },
  floatingBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(26, 36, 27, 0.56)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroBanner: {
    width: "100%",
    height: 232,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(26, 36, 27, 0.30)",
  },
  verdictCardWrapper: {
    marginTop: -52,
    zIndex: 10,
    marginBottom: 20,
  },
  verdictCard: {
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  statusPillMargin: {
    alignSelf: "center",
    marginBottom: 12,
  },
  fruitName: {
    marginBottom: 2,
  },
  subcategory: {
    marginBottom: 14,
  },
  lowConfBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    width: "100%",
  },
  lowConfText: {
    flex: 1,
  },
  urgencyRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  urgencyUnitLabel: {
    marginBottom: 14,
  },
  recommendationText: {
    maxWidth: 280,
    marginBottom: 12,
  },
  detailsSection: {
    gap: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
  },
  shelfLifeCard: {
    borderWidth: 1,
    overflow: "hidden",
  },
  shelfLifeHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 2,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: "relative",
    overflow: "hidden",
  },
  recomLeftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  storageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storageIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  storageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recomCol: {
    flexDirection: "column",
  },
  bestLabel: {
    fontWeight: "700",
    marginTop: 1,
  },
  tipCard: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  tipIcon: {
    marginTop: 2,
  },
  tipTextCol: {
    flex: 1,
  },
  tipHeading: {
    marginBottom: 4,
  },
  ethyleneCard: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
  },
  ethyleneHeading: {
    marginBottom: 2,
  },
  jargonExplainer: {
    marginBottom: 6,
  },
  fixedActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  scanAgainBtn: {
    flex: 1,
    height: 56,
  },
  addInventoryBtn: {
    flex: 2,
    height: 56,
  },
});
