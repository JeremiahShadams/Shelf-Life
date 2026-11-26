/**
 * FRESCO — Summary Pills Row
 * Tappable status filters for the Fridge screen:
 * - Expiring (Carrot Orange)
 * - Expired (Heirloom Crimson)
 * - Fresh (Leaf Green)
 * Every pill meets a 44pt accessible tap target height.
 */

import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { hapticSelection } from "../../utils/haptics";
import { Badge } from "./Badge";

export type SummaryPillType = "expiring" | "expired" | "fresh";

export type SummaryPillsProps = {
  expiringCount: number;
  expiredCount: number;
  freshCount: number;
  activeType?: SummaryPillType | null;
  onPressPill?: (type: SummaryPillType) => void;
  style?: StyleProp<ViewStyle>;
};

export function SummaryPills({
  expiringCount,
  expiredCount,
  freshCount,
  activeType = null,
  onPressPill,
  style,
}: SummaryPillsProps) {
  const { spacing } = useTheme();

  const renderPill = (type: SummaryPillType, label: string, status: "warning" | "expired" | "success") => {
    const isActive = activeType === type;
    if (!onPressPill) {
      return <Badge label={label} status={status} showDot style={styles.pill} />;
    }
    return (
      <Pressable
        key={type}
        accessibilityRole="button"
        accessibilityLabel={`Filter by ${label}`}
        accessibilityState={{ selected: isActive }}
        onPress={() => {
          void hapticSelection();
          onPressPill(type);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={({ pressed }) => [
          styles.pillHitArea,
          { opacity: pressed ? 0.72 : 1 },
        ]}
      >
        <Badge label={label} status={status} showDot active={isActive} style={styles.pill} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { gap: spacing.xs }]}
      >
        {renderPill("expiring", `${expiringCount} expiring`, "warning")}
        {renderPill("expired", `${expiredCount} expired`, "expired")}
        {renderPill("fresh", `${freshCount} fresh`, "success")}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  pillHitArea: {
    minHeight: 44,
    justifyContent: "center",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
