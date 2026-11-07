/**
 * FRESCO — Scan Results Screen
 * Matches SuperDesign draft (d4a0ddc2-987c-4be4-a79c-70f8c9c88c7b):
 * - Floating translucent back button over 240px hero banner
 * - Overlapping elevated verdict card (-mt-14) with status pill & 72px urgency day number
 * - Classification, freshness, and overall confidence metrics
 * - Shelf life comparison table (Counter, Fridge Recommended, Freezer)
 * - Storage tip card with lightbulb icon
 * - Ethylene sensitivity alert card
 * - Fixed dual bottom action bar: [Scan Again] + [Add to Inventory]
 * - Duplicate item dialog integration
 */

import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { Button, ErrorState, Text } from "../components/ui";
import { DuplicateItemDialog } from "../components/fridge";
import {
  useAddToInventory,
  useInventory,
  useUpdateInventoryItem,
} from "../hooks/useInventory";
import { API_URL } from "../services/api";
import type { InventoryItem, ScanResult, StorageMethod } from "../types";

function resolveItemImage(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80";
  }
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("file://")
  ) {
    return imagePath;
  }
  const clean = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${clean}`;
}

export default function ScanResultScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, elevation } = theme;
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

  // Determine status color and label
  let statusBg = colors.statusSuccessSoft;
  let statusColor = colors.statusSuccess;
  let statusText = "Fresh";

  if (daysLeft <= 0 || result.status === "SPOILED") {
    statusBg = colors.dangerSoft;
    statusColor = colors.statusUrgent;
    statusText = "Spoiled";
  } else if (daysLeft <= 1 || result.status === "EAT_TODAY") {
    statusBg = colors.dangerSoft;
    statusColor = colors.statusUrgent;
    statusText = "Eat Today";
  } else if (daysLeft <= 4 || result.status === "EAT_SOON") {
    statusBg = colors.statusWarningSoft;
    statusColor = colors.statusWarning;
    statusText = "Eat Soon";
  }

  // Confidence calculations
  const classPercent = Math.round((result.classification_confidence ?? 0.95) * 100);
  const freshPercent = Math.round((result.freshness_score ?? 0.8) * 100);
  const overallPercent = Math.round((classPercent + freshPercent) / 2);

  // Storage duration formatting
  const counterDays = result.estimated_shelf_life?.room_temp ?? 1;
  const fridgeDays = result.estimated_shelf_life?.fridge ?? 3;
  const freezerDays = result.estimated_shelf_life?.freezer ?? 90;

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
      {/* Floating Back Navigation Button */}
      <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.floatingBackBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 130 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 240px Hero Image Banner with Dark Gradient */}
        <View style={styles.heroBanner}>
          <Image
            source={{ uri: resolveItemImage(result.image_path) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
        </View>

        {/* Elevated Overlapping Verdict Card (-mt-14) */}
        <View
          style={[
            styles.verdictCardWrapper,
            { paddingHorizontal: layout.screenPadding },
          ]}
        >
          <View
            style={[
              styles.verdictCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.modal,
                borderColor: colors.border,
                ...elevation.modal,
              },
            ]}
          >
            {/* Status Pill with Dot */}
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusBg },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: statusColor },
                ]}
              >
                {statusText}
              </Text>
            </View>

            {/* Fruit Name & Category */}
            <Text variant="title" style={styles.fruitName}>
              {result.fruit.name}
            </Text>
            <Text variant="caption" color="secondary" style={styles.subcategory}>
              {result.fruit.subcategory || "Produce"}
            </Text>

            {/* Giant 72px Urgency Number */}
            <View style={styles.urgencyRow}>
              <Text
                style={[
                  styles.urgencyBigNumber,
                  { color: statusColor },
                ]}
              >
                {dayDisplayNumber}
              </Text>
            </View>
            <Text
              style={[
                styles.urgencyUnitLabel,
                { color: statusColor },
              ]}
            >
              {dayDisplayNumber === 1 ? "DAY LEFT" : "DAYS LEFT"}
            </Text>

            {/* Recommendation Paragraph */}
            <Text variant="body" style={styles.recommendationText}>
              {result.recommendation || `Use this ${result.fruit.name} soon to enjoy peak flavor and nutritional quality.`}
            </Text>

            {/* AI Confidence Breakdown Metadata */}
            <Text style={styles.confidenceText}>
              Class {classPercent}% · Fresh {freshPercent}% · Overall {overallPercent}%
            </Text>
          </View>
        </View>

        {/* Additional Details & Shelf Life Table */}
        <View style={[styles.detailsSection, { paddingHorizontal: layout.screenPadding }]}>
          {addError != null && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.dangerSoft, borderRadius: radius.card },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color={colors.statusUrgent} />
              <Text variant="caption" style={{ color: colors.statusUrgent, flex: 1, fontWeight: "600" }}>
                {addError}
              </Text>
            </View>
          )}

          {/* Shelf Life by Storage Table */}
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
              <Text variant="body" style={styles.shelfLifeTitle}>
                Shelf Life Estimate
              </Text>
            </View>

            {/* Counter Row */}
            <Pressable
              onPress={() => setSelectedStorage("room_temp")}
              style={[
                styles.storageRow,
                { borderBottomColor: colors.border },
                selectedStorage === "room_temp" && { backgroundColor: colors.backgroundMuted },
              ]}
            >
              <View style={styles.storageLeft}>
                <View
                  style={[
                    styles.storageIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons name="sunny-outline" size={18} color={colors.textSecondary} />
                </View>
                <Text variant="body" style={styles.storageName}>
                  Counter
                </Text>
              </View>
              <Text
                style={[
                  styles.storageDaysText,
                  { color: counterDays <= 1 ? colors.statusUrgent : colors.textPrimary },
                ]}
              >
                {counterDays} {counterDays === 1 ? "day" : "days"}
              </Text>
            </Pressable>

            {/* Fridge Row (Recommended) */}
            <Pressable
              onPress={() => setSelectedStorage("fridge")}
              style={[
                styles.storageRow,
                styles.storageRowRecommended,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: colors.statusSuccessSoft,
                },
              ]}
            >
              <View
                style={[
                  styles.recomLeftAccent,
                  { backgroundColor: colors.statusSuccess },
                ]}
              />
              <View style={styles.storageLeft}>
                <View
                  style={[
                    styles.storageIconCircle,
                    { backgroundColor: "#FFFFFF" },
                  ]}
                >
                  <Ionicons name="snow-outline" size={18} color={colors.statusSuccess} />
                </View>
                <View style={styles.recomCol}>
                  <Text variant="body" style={[styles.storageName, { fontWeight: "800" }]}>
                    Fridge
                  </Text>
                  <Text
                    style={[
                      styles.recomBadgeText,
                      { color: colors.statusSuccess },
                    ]}
                  >
                    RECOMMENDED
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.storageDaysText,
                  { color: colors.statusWarning, fontWeight: "800" },
                ]}
              >
                {fridgeDays} {fridgeDays === 1 ? "day" : "days"}
              </Text>
            </Pressable>

            {/* Freezer Row */}
            <Pressable
              onPress={() => setSelectedStorage("freezer")}
              style={[
                styles.storageRow,
                selectedStorage === "freezer" && { backgroundColor: colors.backgroundMuted },
              ]}
            >
              <View style={styles.storageLeft}>
                <View
                  style={[
                    styles.storageIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
                </View>
                <Text variant="body" style={styles.storageName}>
                  Freezer
                </Text>
              </View>
              <Text style={[styles.storageDaysText, { color: colors.textSecondary }]}>
                {freezerDays >= 30 ? `Up to ${Math.round(freezerDays / 30)} mo` : `${freezerDays} days`}
              </Text>
            </Pressable>
          </View>

          {/* Storage Tip Card with Lightbulb */}
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
              <Ionicons
                name="bulb-outline"
                size={22}
                color={colors.statusWarning}
                style={styles.tipIcon}
              />
              <View style={styles.tipTextCol}>
                <Text variant="body" style={styles.tipHeading}>
                  Storage Tip
                </Text>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.tipParagraph}
                >
                  {result.storage_tip}
                </Text>
              </View>
            </View>
          )}

          {/* Ethylene Sensitivity Alert Card */}
          {(result.ethylene_note != null || result.fruit.is_ethylene_sensitive || result.fruit.is_ethylene_producer) && (
            <View
              style={[
                styles.ethyleneCard,
                {
                  backgroundColor: colors.statusWarningSoft,
                  borderColor: "#FCE7B8",
                  borderRadius: radius.card,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={22}
                color={colors.statusWarning}
                style={styles.tipIcon}
              />
              <View style={styles.tipTextCol}>
                <Text
                  style={[
                    styles.ethyleneHeading,
                    { color: colors.statusWarning },
                  ]}
                >
                  {result.fruit.is_ethylene_producer ? "Ethylene Producer" : "Ethylene Sensitive"}
                </Text>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.tipParagraph}
                >
                  {result.ethylene_note ||
                    (result.fruit.is_ethylene_producer
                      ? `${result.fruit.name} releases high ethylene gas. Keep away from sensitive produce like leafy greens and tomatoes to avoid rapid spoilage.`
                      : `${result.fruit.name} is sensitive to ethylene gas. Store away from bananas, apples, and avocados.`)}
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
            label="Scan Again"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.scanAgainBtn}
          />

          <Button
            label={added ? "Added to Inventory" : "Add to Inventory"}
            variant="accent"
            loading={addToFridge.isPending}
            disabled={added}
            onPress={handleAdd}
            style={styles.addInventoryBtn}
          />
        </View>
      </View>

      {/* Duplicate Item Dialog */}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroBanner: {
    width: "100%",
    height: 240,
    backgroundColor: "#EEEEEE",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
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
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  fruitName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 2,
    textAlign: "center",
  },
  subcategory: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 16,
  },
  urgencyRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  urgencyBigNumber: {
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 76,
  },
  urgencyUnitLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 14,
  },
  confidenceText: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "600",
    letterSpacing: 0.2,
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
  shelfLifeCard: {
    borderWidth: 1,
    overflow: "hidden",
  },
  shelfLifeHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  shelfLifeTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  storageRowRecommended: {
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
  storageName: {
    fontSize: 14,
    fontWeight: "600",
  },
  recomCol: {
    flexDirection: "column",
  },
  recomBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  storageDaysText: {
    fontSize: 15,
    fontWeight: "700",
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
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  tipParagraph: {
    lineHeight: 18,
  },
  ethyleneCard: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
  },
  ethyleneHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
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
