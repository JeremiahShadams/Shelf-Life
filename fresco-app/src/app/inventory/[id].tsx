/**
 * FRESCO — Inventory Item Detail Screen
 * - Shared offline-safe image resolver (no external Unsplash dependency)
 * - Haptic confirmation on "Mark as eaten" & "Remove"
 * - Fraunces editorial typography for hero title and urgency day numeral
 */

import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import { parseServerDate } from "../../utils/datetime";
import { hapticSuccess, hapticWarning } from "../../utils/haptics";
import { resolveItemImageSource } from "../../utils/images";
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
          message="It may have been removed. Go back and refresh your fridge."
          retryLabel="Go back"
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const item = itemQuery.data;
  const daysLeft = item.days_left ?? item.estimated_days_remaining ?? 0;
  const status: ItemStatus =
    item.status ?? (daysLeft <= 1 ? "EAT_TODAY" : daysLeft <= 4 ? "EAT_SOON" : "FRESH");

  let statusBadgeBg = colors.statusSuccess;
  let statusBadgeLabel = "Fresh";
  let urgencyTextColor = colors.statusSuccess;

  if (daysLeft <= 0 || status === "SPOILED") {
    statusBadgeBg = colors.statusUrgent;
    statusBadgeLabel = "Expired";
    urgencyTextColor = colors.statusUrgent;
  } else if (daysLeft <= 1 || status === "EAT_TODAY") {
    statusBadgeBg = colors.statusUrgent;
    statusBadgeLabel = "Eat Today";
    urgencyTextColor = colors.statusUrgent;
  } else if (daysLeft <= 4 || status === "EAT_SOON") {
    statusBadgeBg = colors.statusWarning;
    statusBadgeLabel = "Eat Soon";
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
          void hapticSuccess();
          setEditSheetVisible(false);
          setToastMessage("Changes saved");
          setToastUndoAction(undefined);
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Couldn't save changes. Try again.");
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
          void hapticSuccess();
          setToastMessage("Marked as eaten");
          setToastUndoAction(() => () => {
            updateItem.mutate({ itemId: item.id, update: { is_consumed: false } });
          });
          setTimeout(() => {
            router.back();
          }, 1800);
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Couldn't update item. Try again.");
        },
      },
    );
  };

  const handleConfirmRemove = () => {
    Alert.alert(
      "Remove item?",
      `${item.fruit.name} will be deleted from your fridge.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setActionError(null);
            deleteItem.mutate(item.id, {
              onSuccess: () => {
                void hapticWarning();
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
    dayDisplayNumber === 1 ? "estimated day remaining" : "estimated days remaining";

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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

          <Text variant="cardTitle" color="primary">
            Item detail
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroBanner, { backgroundColor: colors.backgroundMuted }]}>
          <Image
            source={resolveItemImageSource(
              item.image_path,
              item.fruit.subcategory ?? item.fruit.name,
            )}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroTextContainer}>
            <View style={[styles.heroStatusBadge, { backgroundColor: statusBadgeBg }]}>
              <Text variant="label" color="inverse">
                {statusBadgeLabel}
              </Text>
            </View>

            <Text variant="largeTitle" color="inverse" numberOfLines={1}>
              {item.fruit.name}
            </Text>

            <Text variant="caption" style={styles.heroSubcategory}>
              {item.fruit.subcategory || "Produce"}
            </Text>
          </View>
        </View>

        <View style={[styles.bodyContainer, { paddingHorizontal: spacing.l }]}>
          {actionError && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: colors.dangerSoft, borderRadius: radius.card },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={18} color={colors.statusUrgent} />
              <Text variant="caption" color="danger" style={styles.errorText}>
                {actionError}
              </Text>
            </View>
          )}

          <View style={styles.urgencySection}>
            <Text variant="statusHuge" style={{ color: urgencyTextColor }}>
              {dayDisplayNumber}
            </Text>
            <View style={styles.urgencyTextCol}>
              <Text variant="title" color="primary">
                {daySubtitle}
              </Text>
              <Text variant="micro" color="secondary">
                Estimated, not a guarantee
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.gridCol}>
              <Text variant="micro" color="secondary" style={styles.colLabel}>
                Quantity
              </Text>
              <Text variant="cardTitle" color="primary">
                {item.quantity} {item.quantity === 1 ? "item" : "items"}
              </Text>
            </View>

            <View style={styles.gridCol}>
              <Text variant="micro" color="secondary" style={styles.colLabel}>
                Storage
              </Text>
              <View style={styles.storageValueRow}>
                <Ionicons
                  name={STORAGE_ICONS[item.storage_method] || "snow-outline"}
                  size={18}
                  color={colors.primary}
                  style={styles.storageIcon}
                />
                <Text variant="cardTitle" color="primary">
                  {STORAGE_LABELS[item.storage_method] || "Fridge"}
                </Text>
              </View>
            </View>
          </View>

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
                Added to fridge
              </Text>
              <Text variant="caption" color="primary" style={styles.metaValue}>
                {formatDate(item.scanned_at)}
              </Text>
            </View>

            <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
              <Text variant="caption" color="secondary">
                Estimated expiry
              </Text>
              <Text variant="caption" color="primary" style={styles.metaValue}>
                {formatDate(item.estimated_expiry)}
              </Text>
            </View>

            {item.notes && (
              <View style={[styles.metaRow, { marginTop: spacing.s }]}>
                <Text variant="caption" color="secondary">
                  Note
                </Text>
                <Text variant="caption" color="primary" style={[styles.metaValue, { maxWidth: "65%" }]}>
                  {item.notes}
                </Text>
              </View>
            )}
          </View>

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
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text variant="bodyStrong" color="primary">
                  Storage tip
                </Text>
              </View>
              <Text variant="caption" color="secondary">
                {item.fruit.storage_tips}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
            <Ionicons name="trash-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

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
  scrollContent: {
    flexGrow: 1,
  },
  heroBanner: {
    width: "100%",
    height: 256,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(26, 36, 27, 0.48)",
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
    borderRadius: 6,
    marginBottom: 8,
  },
  heroSubcategory: {
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
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
    flex: 1,
  },
  urgencySection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 14,
    marginBottom: 28,
  },
  urgencyTextCol: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  gridCol: {
    flex: 1,
  },
  colLabel: {
    marginBottom: 4,
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
