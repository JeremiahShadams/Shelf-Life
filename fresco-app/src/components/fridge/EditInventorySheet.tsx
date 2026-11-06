/**
 * FRESCO — Uber Base Edit Inventory Item Bottom Sheet Modal
 * Matches SuperDesign draft:
 * - Drag handle & header with (X) close button
 * - Quantity stepper with circular plus/minus buttons & 24px bold count
 * - 3-Way Storage Location segmented control (Counter, Fridge, Freezer)
 * - Multiline note field
 * - 56px solid black "Save changes" CTA
 */

import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import type { StorageMethod } from "../../types/api";
import { Button } from "../ui/Button";
import { Text } from "../ui/Text";

const STORAGE_OPTIONS: { key: StorageMethod; label: string }[] = [
  { key: "room_temp", label: "Counter" },
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Freezer" },
];

export interface EditInventorySheetProps {
  visible: boolean;
  initialQuantity: number;
  initialStorage: StorageMethod;
  initialNotes?: string | null;
  fruitName?: string;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: {
    quantity: number;
    storage_method: StorageMethod;
    notes?: string | null;
  }) => void;
}

export function EditInventorySheet({
  visible,
  initialQuantity,
  initialStorage,
  initialNotes,
  isSaving = false,
  onClose,
  onSave,
}: EditInventorySheetProps) {
  const theme = useTheme();
  const { colors, spacing, radius, elevation } = theme;
  const insets = useSafeAreaInsets();

  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [storage, setStorage] = useState<StorageMethod>(initialStorage || "fridge");
  const [notes, setNotes] = useState(initialNotes || "");

  // Sync state whenever sheet opens with new item data
  useEffect(() => {
    if (visible) {
      setQuantity(Math.max(1, initialQuantity || 1));
      setStorage(initialStorage || "fridge");
      setNotes(initialNotes || "");
    }
  }, [visible, initialQuantity, initialStorage, initialNotes]);

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleSave = () => {
    onSave({
      quantity,
      storage_method: storage,
      notes: notes.trim().length > 0 ? notes.trim() : null,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Dimmed backdrop */}
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close edit sheet"
        />

        {/* Bottom Sheet Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: radius.sheet,
                borderTopRightRadius: radius.sheet,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handleBar,
                  { backgroundColor: colors.borderStrong },
                ]}
              />
            </View>

            {/* Header */}
            <View
              style={[
                styles.headerRow,
                {
                  borderBottomColor: colors.border,
                  paddingHorizontal: spacing.l,
                  paddingBottom: spacing.s,
                },
              ]}
            >
              <Text
                variant="headline"
                style={[styles.headerTitle, { color: colors.textPrimary }]}
              >
                Edit item
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.backgroundMuted },
                ]}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={colors.textPrimary}
                />
              </Pressable>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.contentContainer,
                { paddingHorizontal: spacing.l, paddingTop: spacing.m },
              ]}
            >
              {/* Quantity Section */}
              <View style={styles.formSection}>
                <Text
                  variant="body"
                  style={[styles.fieldLabel, { color: colors.textPrimary }]}
                >
                  Quantity
                </Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                    disabled={quantity <= 1 || isSaving}
                    onPress={handleDecrement}
                    style={({ pressed }) => [
                      styles.stepperMinus,
                      {
                        borderColor: colors.border,
                        backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                        opacity: quantity <= 1 ? 0.35 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={colors.textPrimary}
                    />
                  </Pressable>

                  <Text
                    variant="title"
                    style={[styles.quantityValue, { color: colors.textPrimary }]}
                  >
                    {quantity}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                    disabled={isSaving}
                    onPress={handleIncrement}
                    style={({ pressed }) => [
                      styles.stepperPlus,
                      {
                        backgroundColor: colors.primary,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={colors.primaryText}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Storage Location Section */}
              <View style={styles.formSection}>
                <Text
                  variant="body"
                  style={[styles.fieldLabel, { color: colors.textPrimary }]}
                >
                  Storage Location
                </Text>
                <View
                  style={[
                    styles.storageSegmentContainer,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  {STORAGE_OPTIONS.map((opt) => {
                    const isSelected = storage === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => setStorage(opt.key)}
                        style={[
                          styles.storageSegment,
                          isSelected && [
                            styles.storageSegmentActive,
                            {
                              backgroundColor: colors.surface,
                              ...elevation.card,
                            },
                          ],
                        ]}
                      >
                        <Text
                          variant="caption"
                          style={[
                            styles.storageSegmentText,
                            {
                              color: isSelected ? colors.textPrimary : colors.textSecondary,
                              fontWeight: isSelected ? "700" : "600",
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Note Section */}
              <View style={[styles.formSection, { marginBottom: spacing.m }]}>
                <View style={styles.labelWithSubtext}>
                  <Text
                    variant="body"
                    style={[styles.fieldLabel, { color: colors.textPrimary, marginBottom: 0 }]}
                  >
                    Note{" "}
                    <Text variant="caption" color="secondary" style={styles.optionalText}>
                      (Optional)
                    </Text>
                  </Text>
                </View>

                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Bottom crisper drawer, left side"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: colors.backgroundMuted,
                      color: colors.textPrimary,
                      borderRadius: radius.card,
                    },
                  ]}
                />
              </View>
            </ScrollView>

            {/* Bottom Primary Button */}
            <View style={[styles.footerContainer, { paddingHorizontal: spacing.l }]}>
              <Button
                label="Save changes"
                variant="primary"
                block
                loading={isSaving}
                onPress={handleSave}
                style={styles.saveBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboardContainer: {
    width: "100%",
  },
  sheetContainer: {
    width: "100%",
    maxHeight: "90%",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    paddingBottom: 24,
  },
  formSection: {
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepperMinus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperPlus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: "900",
    minWidth: 36,
    textAlign: "center",
  },
  storageSegmentContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  storageSegment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  storageSegmentActive: {},
  storageSegmentText: {
    fontSize: 14,
  },
  labelWithSubtext: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  optionalText: {
    fontWeight: "400",
  },
  notesInput: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "500",
    textAlignVertical: "top",
  },
  footerContainer: {
    paddingTop: 8,
  },
  saveBtn: {
    height: 56,
  },
});

