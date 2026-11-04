/**
 * FRESCO — Uber Base Summary Pills Row
 * Displays high-level status breakdown:
 *   • [x] expiring (red)
 *   • [x] expired (gray)
 *   • [x] fresh (green)
 */

import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { Badge } from "./Badge";

export type SummaryPillsProps = {
  expiringCount: number;
  expiredCount: number;
  freshCount: number;
  style?: StyleProp<ViewStyle>;
  onPressPill?: (type: "expiring" | "expired" | "fresh") => void;
};

export function SummaryPills({
  expiringCount,
  expiredCount,
  freshCount,
  style,
  onPressPill,
}: SummaryPillsProps) {
  const theme = useTheme();
  const { spacing } = theme;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { gap: spacing.xs }]}
      >
        <Badge
          label={`${expiringCount} expiring`}
          status="urgent"
          showDot
          style={styles.pill}
        />
        <Badge
          label={`${expiredCount} expired`}
          status="expired"
          showDot
          style={styles.pill}
        />
        <Badge
          label={`${freshCount} fresh`}
          status="success"
          showDot
          style={styles.pill}
        />
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
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
