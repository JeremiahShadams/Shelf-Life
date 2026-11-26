/**
 * FRESCO — Inventory Card
 * Displays each tracked item with:
 * - Left status accent strip (Crimson urgent/expired, Carrot amber soon, Leaf green fresh)
 * - 48x48 captured produce thumbnail (with offline local placeholder fallback)
 * - Item name + storage & quantity using locked Text variants (no inline overrides)
 * - Right-aligned Fraunces urgency numeral & day unit
 */

import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { resolveItemImageSource } from "../../utils/images";
import { Text } from "./Text";

export type InventoryCardProps = {
  name: string;
  storage: string;
  category?: string;
  imagePath?: string | null;
  quantity?: number;
  daysLeft: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function InventoryCard({
  name,
  storage,
  category,
  imagePath,
  quantity = 1,
  daysLeft,
  onPress,
  style,
}: InventoryCardProps) {
  const theme = useTheme();
  const { colors, spacing, radius, borders } = theme;

  let statusColor = colors.statusSuccess;
  let statusText = "Days left";

  if (daysLeft <= 0) {
    statusColor = colors.statusUrgent;
    statusText = "Expired";
  } else if (daysLeft <= 1) {
    statusColor = colors.statusUrgent;
    statusText = "Day left";
  } else if (daysLeft <= 4) {
    statusColor = colors.statusWarning;
    statusText = "Days left";
  } else {
    statusColor = colors.statusSuccess;
    statusText = "Days left";
  }

  const displayDays = daysLeft <= 0 ? 0 : Math.max(1, Math.ceil(daysLeft));

  const storageLabel = (() => {
    const sLower = (storage || "").toLowerCase();
    if (sLower === "fridge") return "Fridge";
    if (sLower === "freezer") return "Freezer";
    if (sLower === "pantry") return "Pantry";
    return "Counter";
  })();

  const qtyText = quantity > 1 ? `${quantity} items` : "1 item";
  const metaString = `${storageLabel}, ${qtyText}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.card + 2,
          borderColor: colors.border,
          borderWidth: borders.hairline,
          transform: [{ scale: pressed && onPress ? 0.99 : 1 }],
        },
        styles.shadow,
        { shadowColor: colors.shadow },
        style,
      ]}
    >
      <View
        style={[
          styles.accentStrip,
          {
            backgroundColor: statusColor,
            width: borders.accentStrip,
          },
        ]}
      />

      <View style={[styles.contentRow, { padding: spacing.m }]}>
        <Image
          source={resolveItemImageSource(imagePath, category ?? name)}
          style={[
            styles.thumbnail,
            {
              backgroundColor: colors.backgroundMuted,
              borderRadius: radius.sm + 2,
              borderColor: colors.border,
            },
          ]}
          resizeMode="cover"
        />

        <View style={styles.infoCol}>
          <Text variant="cardTitle" color="primary" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="cardMeta" color="secondary" numberOfLines={1} style={styles.metaLine}>
            {metaString}
          </Text>
        </View>

        <View style={styles.urgencyCol}>
          <Text variant="statusLarge" style={{ color: statusColor }}>
            {displayDays}
          </Text>
          <Text variant="micro" style={{ color: statusColor }}>
            {statusText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
  },
  accentStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderWidth: 1,
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  metaLine: {
    marginTop: 3,
  },
  urgencyCol: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 56,
  },
  shadow: {
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
