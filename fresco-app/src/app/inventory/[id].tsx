/**
 * FRESCO — Inventory Item Detail Screen
 * Matches SuperDesign draft (a36ece01-4ae0-4474-9861-dcd7e5400240):
 * - Hero image banner (256px / h-64) with gradient scrim
 * - Floating uppercase status badge (EAT TODAY, EAT SOON, FRESH)
 * - Giant 72px (7xl) bold urgency day counter
 * - 2-Column Info Grid: Quantity & Storage with icons
 * - Fixed bottom action bar: 56px solid black "Mark as eaten" + 56x56px gray trash button
 * - Edit item modal sheet integration
 * - Action toast with Undo support
 */

import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, ErrorState, Loading, Text, Toast } from "../../components/ui";
import { EditInventorySheet } from "../../components/fridge/EditInventorySheet";
import {
  useDeleteInventoryItem,
  useInventoryItem,
  useUpdateInventoryItem,
} from "../../hooks/useInventory";
import { API_URL } from "../../services/api";
import { parseServerDate } from "../../utils/datetime";
import type { ItemStatus, StorageMethod } from "../../types/api";

const STORAGE_ICONS: Record<StorageMethod, keyof typeof Ionicons.glyphMap> = {
  room_temp: "sunny-outline",
  fridge: "snow-outline",
  freezer: "cube-outline",
};

const STORAGE_LABELS: Record<StorageMethod, string> = {
  room_temp: "Counter",
  fridge: "Fridge",
  freezer: "Freezer",
};

function formatDate(value: string): string {
  const date = parseServerDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function resolveItemImage(imagePath: string | null | undefined): string {
  if (!imagePath) {
    // High-resolution fallback fresh fruit banner
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

export default function InventoryItemScreen() {
  const theme = useTheme();
  const { colors, spacing, radius, elevation } = theme;
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const itemId = Number(params.id);

  const itemQuery = useInventoryItem(Number.isFinite(itemId) ? itemId : null);
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastUndoAction, setToastUndoAction] = useState<(() => void) | undefined>(undefined);
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
  const daysLeft = item.days_left ?? item.estimated_days_remaining ?? 0;
  const status: ItemStatus = item.status ?? (daysLeft <= 1 ? "EAT_TODAY" : daysLeft <= 4 ? "EAT_SOON" : "FRESH");

  // Determine badge styling and text
  let statusBadgeBg = colors.statusSuccess;
  let statusBadgeLabel = "FRESH";
  let urgencyTextColor = colors.statusSuccess;

  if (daysLeft <= 0 || status === "SPOILED") {
    statusBadgeBg = colors.statusUrgent;
    statusBadgeLabel = "EXPIRED";
    urgencyTextColor = colors.statusUrgent;
  } else if (daysLeft <= 1 || status === "EAT_TODAY") {
    statusBadgeBg = colors.statusUrgent;
    statusBadgeLabel = "EAT TODAY";
    urgencyTextColor = colors.statusUrgent;
  } else if (daysLeft <= 4 || status === "EAT_SOON") {
    statusBadgeBg = colors.statusWarning;
    statusBadgeLabel = "EAT SOON";
    urgencyTextColor = colors.statusWarning;
  }

  const handleEditSave = (values: {
    quantity: number;
    storage_method: StorageMethod;
    notes?: string | null;
  }) => {
    setActionError(null);
    updateItem.mutate(
      {
        itemId: item.id,
        update: values,
      },
      {
        onSuccess: () => {
          setEditSheetVisible(false);
          setToastMessage("Changes saved");
          setToastUndoAction(undefined);
        },
        onError: (err) => {
          setActionError(
            err instanceof Error ? err.message : "Couldn't save changes. Try again.",
          );
        },
      },
    );
  };

  const handleMarkEaten = () => {
    setActionError(null);
    updateItem.mutate(
      { itemId: item.id, update: { is_consumed: true } },
      {
        onSuccess: () => {
          setToastMessage("Marked as eaten");
          setToastUndoAction(() => () => {
            updateItem.mutate({ itemId: item.id, update: { is_consumed: false } });
          });
          // Allow user brief moment to undo, otherwise navigate back
          setTimeout(() => {
            router.back();
          }, 1800);
        },
        onError: (err) => {
          setActionError(
            err instanceof Error ? err.message : "Couldn't update item. Try again.",
          );
        },
      },
    );
  };

  const handleConfirmRemove = () => {
    Alert.alert(
      "Remove item?",
      `${item.fruit.name} will be deleted from your inventory.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setActionError(null);
            deleteItem.mutate(item.id, {
              onSuccess: () => {
                setToastMessage("Item removed");
                setToastUndoAction(undefined);
                router.back();
              },
              onError: (err) => {
                setActionError(
                  err instanceof Error ? err.message : "Couldn't remove item. Try again.",
                );
              },
            });
          },
        },
      ],
    );
  };

  const dayDisplayNumber = Math.max(0, Math.ceil(daysLeft));
  const daySubtitle =
    dayDisplayNumber === 1
      ? "estimated day remaining"
      : "estimated days remaining";

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Navigation Header */}
      <SafeAreaView edges={["top"]} style={styles.topSafeArea}>
        <View style={styles.navHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.navIconButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <Text variant="title" style={styles.navTitle}>
            Item Detail
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit item"
            onPress={() => setEditSheetVisible(true)}
            style={({ pressed }) => [
              styles.navIconButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Container (256px / h-64) */}
        <View style={styles.heroBanner}>
          <Image
            source={{ uri: resolveItemImage(item.image_path) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Dark Overlay Scrim for high contrast text */}
          <View style={styles.heroOverlay} />

          {/* Floating Badges & Fruit Name on Hero */}
          <View style={styles.heroTextContainer}>
            <View
              style={[
                styles.heroStatusBadge,
                { backgroundColor: statusBadgeBg },
              ]}
            >
              <Text style={styles.heroStatusBadgeText}>
                {statusBadgeLabel}
              </Text>
            </View>

            <Text style={styles.heroFruitName} numberOfLines={1}>
              {item.fruit.name}
            </Text>

            <Text style={styles.heroSubcategory}>
              {item.fruit.subcategory || "Produce"}
            </Text>
          </View>
        </View>

        {/* Main Body */}
        <View style={[styles.bodyContainer, { paddingHorizontal: spacing.l }]}>
          {/* Action Error if any */}
          {actionError && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: colors.dangerSoft, borderRadius: radius.card },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colors.statusUrgent}
              />
              <Text
                variant="caption"
                style={[styles.errorText, { color: colors.statusUrgent }]}
              >
                {actionError}
              </Text>
            </View>
          )}

          {/* Giant Urgency Metric Section */}
          <View style={styles.urgencySection}>
            <Text
              style={[
                styles.urgencyBigNumber,
                { color: urgencyTextColor },
              ]}
            >
              {dayDisplayNumber}
            </Text>
            <View style={styles.urgencyTextCol}>
              <Text
                variant="title"
                style={[styles.urgencyDayText, { color: colors.textPrimary }]}
              >
                {daySubtitle}
              </Text>
              <Text
                variant="caption"
                style={[styles.urgencyDisclaimer, { color: colors.textSecondary }]}
              >
                Estimated, not a guarantee
              </Text>
            </View>
          </View>

          {/* 2-Column Info Grid (Quantity & Storage) */}
          <View style={styles.infoGrid}>
            <View style={styles.gridCol}>
              <Text
                variant="caption"
                style={[styles.colLabel, { color: colors.textSecondary }]}
              >
                Quantity
              </Text>
              <Text
                variant="headline"
                style={[styles.colValue, { color: colors.textPrimary }]}
              >
                {item.quantity} {item.quantity === 1 ? "item" : "items"}
              </Text>
            </View>

            <View style={styles.gridCol}>
              <Text
                variant="caption"
                style={[styles.colLabel, { color: colors.textSecondary }]}
              >
                Storage
              </Text>
              <View style={styles.storageValueRow}>
                <Ionicons
                  name={STORAGE_ICONS[item.storage_method] || "snow-outline"}
                  size={18}
                  color={colors.textSecondary}
                  style={styles.storageIcon}
                />
                <Text
                  variant="headline"
                  style={[styles.colValue, { color: colors.textPrimary }]}
                >
                  {STORAGE_LABELS[item.storage_method] || "Fridge"}
                </Text>
              </View>
            </View>
          </View>

          {/* Dates & Timeline Meta */}
          <View
            style={[
              styles.metaCard,
              {
                backgroundColor: colors.backgroundMuted,
                borderRadius: radius.card,
                padding: spacing.m,
              },
            ]}
          >
            <View style={styles.metaRow}>
              <Text variant="caption" color="secondary">
                Added to inventory
              </Text>
              <Text variant="caption" style={styles.metaValue}>
                {formatDate(item.scanned_at)}
              </Text>
            </View>

            <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
              <Text variant="caption" color="secondary">
                Estimated expiry
              </Text>
              <Text variant="caption" style={styles.metaValue}>
                {formatDate(item.estimated_expiry)}
              </Text>
            </View>

            {item.notes && (
              <View style={[styles.metaRow, { marginTop: spacing.s }]}>
                <Text variant="caption" color="secondary">
                  Note
                </Text>
                <Text variant="caption" style={[styles.metaValue, { maxWidth: "65%" }]}>
                  {item.notes}
                </Text>
              </View>
            )}
          </View>

          {/* Storage Tip Card */}
          {item.fruit.storage_tips && (
            <View
              style={[
                styles.tipCard,
                {
                  borderColor: colors.border,
                  borderRadius: radius.card,
                  padding: spacing.m,
                  marginTop: spacing.m,
                },
              ]}
            >
              <View style={styles.tipHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.textPrimary}
                />
                <Text variant="body" style={styles.tipTitle}>
                  Storage Tip
                </Text>
              </View>
              <Text
                variant="caption"
                style={[styles.tipBody, { color: colors.textSecondary }]}
              >
                {item.fruit.storage_tips}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 24),
            ...elevation.modal,
          },
        ]}
      >
        <View style={styles.buttonRow}>
          <Button
            label="Mark as eaten"
            variant="primary"
            block
            loading={updateItem.isPending}
            onPress={handleMarkEaten}
            style={styles.markEatenBtn}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove item"
            disabled={deleteItem.isPending}
            onPress={handleConfirmRemove}
            style={({ pressed }) => [
              styles.trashIconButton,
              {
                backgroundColor: colors.backgroundMuted,
                borderRadius: radius.card,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>

      {/* Edit Item Bottom Sheet */}
      <EditInventorySheet
        visible={editSheetVisible}
        initialQuantity={item.quantity}
        initialStorage={item.storage_method}
        initialNotes={item.notes}
        fruitName={item.fruit.name}
        isSaving={updateItem.isPending}
        onClose={() => setEditSheetVisible(false)}
        onSave={handleEditSave}
      />

      {/* Action Toast with Undo */}
      <Toast
        visible={toastMessage != null}
        message={toastMessage || ""}
        onUndo={toastUndoAction}
        onDismiss={() => {
          setToastMessage(null);
          setToastUndoAction(undefined);
        }}
        bottomOffset={104 + insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topSafeArea: {
    zIndex: 10,
  },
  navHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  navIconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroBanner: {
    width: "100%",
    height: 256,
    position: "relative",
    backgroundColor: "#F6F6F6",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  heroTextContainer: {
    position: "absolute",
    left: 20,
    bottom: 18,
    right: 20,
  },
  heroStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  heroStatusBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroFruitName: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  heroSubcategory: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
  },
  bodyContainer: {
    paddingTop: 24,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontWeight: "600",
    flex: 1,
  },
  urgencySection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 14,
    marginBottom: 32,
  },
  urgencyBigNumber: {
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 76,
  },
  urgencyTextCol: {
    flexDirection: "column",
    justifyContent: "center",
  },
  urgencyDayText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  urgencyDisclaimer: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  gridCol: {
    flex: 1,
  },
  colLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  colValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  storageValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storageIcon: {
    marginRight: 6,
  },
  metaCard: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaValue: {
    fontWeight: "600",
  },
  tipCard: {
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  tipTitle: {
    fontWeight: "700",
    fontSize: 14,
  },
  tipBody: {
    lineHeight: 18,
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markEatenBtn: {
    flex: 1,
    height: 56,
  },
  trashIconButton: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
