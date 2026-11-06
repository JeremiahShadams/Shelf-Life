/**
 * FRESCO — Uber Base Duplicate Item Dialog Modal
 * Matches SuperDesign draft:
 * - 48x48 gray circle with copy icon
 * - "Duplicate item" bold heading
 * - Explanatory message mentioning existing item count and fruit name
 * - 48px Solid Black button "Add to quantity"
 * - 48px Light Gray button "Create new entry"
 */

import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Button } from "../ui/Button";
import { Text } from "../ui/Text";

export interface DuplicateItemDialogProps {
  visible: boolean;
  fruitName: string;
  existingQuantity?: number;
  newQuantity?: number;
  loading?: boolean;
  onAddToQuantity: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

export function DuplicateItemDialog({
  visible,
  fruitName,
  existingQuantity = 1,
  newQuantity = 1,
  loading = false,
  onAddToQuantity,
  onCreateNew,
  onCancel,
}: DuplicateItemDialogProps) {
  const theme = useTheme();
  const { colors, spacing, radius, elevation } = theme;

  const countDisplay =
    existingQuantity > 1 ? `${existingQuantity} ${fruitName}s` : `${existingQuantity} ${fruitName}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        {/* Dimmed Backdrop */}
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        />

        {/* Dialog Card */}
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.modal,
              padding: spacing.xl,
              ...elevation.modal,
            },
          ]}
        >
          {/* Copy Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.backgroundMuted },
            ]}
          >
            <Ionicons
              name="copy-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          {/* Title */}
          <Text
            variant="headline"
            style={[styles.title, { color: colors.textPrimary }]}
          >
            Duplicate item
          </Text>

          {/* Description */}
          <Text
            variant="body"
            style={[
              styles.description,
              { color: colors.textSecondary, marginBottom: spacing.xl },
            ]}
          >
            You already have {countDisplay} in your inventory. Add this
            {newQuantity > 1 ? ` quantity (${newQuantity})` : " item"} to the existing item, or create a new entry?
          </Text>

          {/* Action Buttons */}
          <View style={[styles.buttonGroup, { gap: spacing.xs }]}>
            <Button
              label="Add to quantity"
              variant="primary"
              block
              loading={loading}
              onPress={onAddToQuantity}
              style={styles.actionBtn}
            />

            <Button
              label="Create new entry"
              variant="secondary"
              block
              disabled={loading}
              onPress={onCreateNew}
              style={styles.actionBtn}
            />

            <Pressable
              onPress={onCancel}
              style={styles.cancelLink}
              hitSlop={8}
            >
              <Text variant="caption" color="secondary" style={styles.cancelText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialogContainer: {
    width: "100%",
    maxWidth: 340,
    zIndex: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  buttonGroup: {
    flexDirection: "column",
  },
  actionBtn: {
    height: 48,
  },
  cancelLink: {
    alignSelf: "center",
    paddingVertical: 6,
    marginTop: 4,
  },
  cancelText: {
    fontWeight: "600",
  },
});

