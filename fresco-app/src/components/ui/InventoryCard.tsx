/**
 * FRESCO — Uber Base Inventory Card
 * List item card matching Uber Base design system:
 * - Left accent colored vertical strip (Red urgent, Amber warning, Green fresh)
 * - Item title (bold, 17px) & category/storage metadata
 * - Right-aligned large urgency number (32px bold) & uppercase unit (DAY LEFT / DAYS)
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export type InventoryCardProps = {
  name: string;
  storage: string;
  category?: string;
  quantity?: number;
  daysLeft: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function InventoryCard({
  name,
  storage,
  category,
  quantity = 1,
  daysLeft,
  onPress,
  style,
}: InventoryCardProps) {
  const theme = useTheme();
  const { colors, spacing, radius, borders } = theme;

  // Determine status color per Uber Base system
  let statusColor = colors.statusSuccess;
  let statusText = "DAYS";

  if (daysLeft <= 0) {
    statusColor = colors.statusUrgent;
    statusText = "EXPIRED";
  } else if (daysLeft === 1) {
    statusColor = colors.statusUrgent;
    statusText = "DAY LEFT";
  } else if (daysLeft <= 4) {
    statusColor = colors.statusWarning;
    statusText = "DAYS";
  } else {
    statusColor = colors.statusSuccess;
    statusText = "DAYS";
  }

  // Format metadata line: e.g. "Fridge · Nightshade · Qty: 2"
  const metaParts: string[] = [];
  if (storage) {
    const sLower = storage.toLowerCase();
    metaParts.push(
      sLower === "fridge"
        ? "Fridge"
        : sLower === "freezer"
          ? "Freezer"
          : sLower === "pantry"
            ? "Pantry"
            : "Counter",
    );
  }
  if (category && category.toLowerCase() !== "other") {
    metaParts.push(category);
  }
  if (quantity) {
    metaParts.push(`Qty: ${quantity}`);
  }
  const metaString = metaParts.join(" · ");

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
        style,
      ]}
    >
      {/* Left colored accent strip */}
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
        {/* Item Info */}
        <View style={styles.infoCol}>
          <Text
            variant="cardTitle"
            numberOfLines={1}
            style={{
              color: colors.textPrimary,
              fontSize: 17,
              fontWeight: "700",
              letterSpacing: -0.2,
            }}
          >
            {name}
          </Text>
          <Text
            variant="caption"
            numberOfLines={1}
            style={{
              color: colors.textSecondary,
              marginTop: 4,
              fontSize: 13,
            }}
          >
            {metaString}
          </Text>
        </View>

        {/* Right Urgency Indicator */}
        <View style={styles.urgencyCol}>
          <Text
            style={[
              styles.urgencyNumber,
              {
                color: statusColor,
              },
            ]}
          >
            {daysLeft <= 0 ? "0" : Math.round(daysLeft)}
          </Text>
          <Text
            style={[
              styles.urgencyUnit,
              {
                color: statusColor,
              },
            ]}
          >
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
    justifyContent: "space-between",
    paddingLeft: 20, // Extra padding to offset the left strip
  },
  infoCol: {
    flex: 1,
    paddingRight: 12,
  },
  urgencyCol: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  urgencyNumber: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  urgencyUnit: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 2,
  },
  shadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});

