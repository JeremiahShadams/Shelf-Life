/**
 * FRESCO — Uber Base Added to Inventory Success View
 * Matches Image 3:
 * - Centered soft-green circle with crisp green checkmark
 * - Title: "Added to inventory"
 * - Subtitle: "[Item name] has been saved. We'll remind you before it expires."
 * - Two full-width stacked buttons: "View inventory" (Black) and "Scan another" (Light Gray)
 */

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { Button } from "../ui/Button";
import { Text } from "../ui/Text";

export type AddedSuccessViewProps = {
  itemName: string;
  onViewInventory: () => void;
  onScanAnother: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AddedSuccessView({
  itemName,
  onViewInventory,
  onScanAnother,
  style,
}: AddedSuccessViewProps) {
  const theme = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.l }, style]}>
      <View style={styles.content}>
        {/* Soft Green Circle with Checkmark */}
        <View
          style={[
            styles.checkCircle,
            {
              backgroundColor: colors.statusSuccessSoft,
            },
          ]}
        >
          <Ionicons name="checkmark" size={38} color={colors.statusSuccess} />
        </View>

        {/* Title */}
        <Text
          variant="headline"
          style={[
            styles.title,
            {
              color: colors.textPrimary,
              marginTop: spacing.xl,
            },
          ]}
        >
          Added to inventory
        </Text>

        {/* Subtitle */}
        <Text
          variant="body"
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              marginTop: spacing.xs + 2,
            },
          ]}
        >
          {itemName} has been saved. We&apos;ll remind you before it expires.
        </Text>
      </View>

      {/* Stacked Actions */}
      <View style={[styles.actions, { gap: spacing.s, marginTop: spacing.xxl }]}>
        <Button
          label="View inventory"
          variant="primary"
          block
          onPress={onViewInventory}
        />
        <Button
          label="Scan another"
          variant="secondary"
          block
          onPress={onScanAnother}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 290,
  },
  actions: {
    width: "100%",
  },
});

