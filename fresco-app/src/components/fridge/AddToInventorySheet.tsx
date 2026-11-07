/**
 * FRESCO — Uber Base Add To Inventory Bottom Sheet Modal
 * Matches Images 2 & 3:
 * - Dimmed backdrop with modal sheet sliding up
 * - Drag handle & header with (X) close button
 * - Item preview card (image + name + • FRESH badge)
 * - 56px solid Black button "Save to inventory"
 * - Seamless transition to "Added to inventory" success view
 */

import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Text } from "../ui/Text";
import { AddedSuccessView } from "./AddedSuccessView";

export type PendingInventoryItem = {
  name: string;
  imageUri?: string;
  status?: string;
  storage?: string;
  daysLeft?: number;
};

export type AddToInventorySheetProps = {
  visible: boolean;
  item: PendingInventoryItem;
  isSaving?: boolean;
  onClose: () => void;
  onSave: () => void;
  onViewInventory: () => void;
  onScanAnother: () => void;
};

export function AddToInventorySheet({
  visible,
  item,
  isSaving = false,
  onClose,
  onSave,
  onViewInventory,
  onScanAnother,
}: AddToInventorySheetProps) {
  const theme = useTheme();
  const { colors, spacing, radius } = theme;
  const [isSuccess, setIsSuccess] = useState(false);

  // When sheet becomes invisible or re-opens, reset step state
  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  const handleSave = async () => {
    onSave();
    setIsSuccess(true);
  };

  const handleViewInventory = () => {
    setIsSuccess(false);
    onViewInventory();
  };

  const handleScanAnother = () => {
    setIsSuccess(false);
    onScanAnother();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Dimmed backdrop */}
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={handleClose}
        />

        {/* Bottom Sheet Card */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              shadowColor: colors.shadow,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handleWrapper}>
            <View
              style={[
                styles.handle,
                { backgroundColor: colors.borderStrong },
              ]}
            />
          </View>

          {isSuccess ? (
            <AddedSuccessView
              itemName={item.name}
              onViewInventory={handleViewInventory}
              onScanAnother={handleScanAnother}
            />
          ) : (
            <View style={{ paddingHorizontal: spacing.l, paddingBottom: spacing.xl }}>
              {/* Header: Title & Close Button */}
              <View style={[styles.headerRow, { marginBottom: spacing.m }]}>
                <Text
                  variant="headline"
                  style={{
                    color: colors.textPrimary,
                    fontSize: 20,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                  }}
                >
                  Add to inventory
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close sheet"
                  onPress={handleClose}
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: colors.secondaryAction,
                    },
                  ]}
                >
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </Pressable>
              </View>

              {/* Item Preview Card */}
              <View
                style={[
                  styles.itemCard,
                  {
                    borderColor: colors.border,
                    borderRadius: radius.card,
                    backgroundColor: colors.surface,
                    padding: spacing.m,
                    marginBottom: spacing.xl,
                  },
                ]}
              >
                {/* Thumbnail Image */}
                <View
                  style={[
                    styles.thumbnailContainer,
                    {
                      backgroundColor: colors.backgroundMuted,
                      borderRadius: radius.sm + 2,
                    },
                  ]}
                >
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="nutrition-outline" size={28} color={colors.textSecondary} />
                  )}
                </View>

                {/* Details */}
                <View style={[styles.itemDetails, { marginLeft: spacing.m }]}>
                  <Text
                    variant="cardTitle"
                    style={{
                      color: colors.textPrimary,
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    {item.name}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <Badge
                      label={item.status ? item.status.toUpperCase() : "FRESH"}
                      status="success"
                      showDot
                    />
                  </View>
                </View>
              </View>

              {/* Save Button - Carrot Orange action trigger */}
              <Button
                label="Save to inventory"
                variant="accent"
                loading={isSaving}
                block
                onPress={handleSave}
              />
            </View>
          )}
        </View>
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
  sheetContainer: {
    width: "100%",
    paddingBottom: 24,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  handleWrapper: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
});
