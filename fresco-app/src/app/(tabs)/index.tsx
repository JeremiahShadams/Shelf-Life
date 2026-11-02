/**
 * Fresco — Scan (Home) Screen
 * Primary entry point: prominent scan action, quick camera trigger,
 * and immediate urgency preview of items expiring today.
 */

import { useState } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Text, Button, Card, Badge } from "../../components/ui";
import { useFridgeStore } from "../../stores/fridgeStore";

export default function ScanScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;
  const { items } = useFridgeStore();

  const [isScanning, setIsScanning] = useState(false);

  // Find urgent items (<= 2 days left)
  const urgentItems = items.filter((i) => !i.is_consumed && i.days_left <= 2);

  const handleLaunchCamera = () => {
    setIsScanning(true);
    // In demo/dev, simulate scan completion
    setTimeout(() => {
      setIsScanning(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xxl },
        ]}
      >
        {/* Header */}
        <View style={{ marginTop: spacing.m, marginBottom: spacing.l }}>
          <Text variant="largeTitle">Fresco</Text>
          <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
            Check freshness, preserve food, save money.
          </Text>
        </View>

        {/* Big Shutter / Viewfinder Card */}
        <Card style={{ alignItems: "center", paddingVertical: spacing.xl }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan Food"
            onPress={handleLaunchCamera}
            style={({ pressed }) => [
              styles.shutterButton,
              {
                backgroundColor: colors.primary,
                width: layout.cameraButton,
                height: layout.cameraButton,
                borderRadius: layout.cameraButton / 2,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons
              name="camera"
              size={32}
              color={theme.dark ? colors.background : "#FFFFFF"}
            />
          </Pressable>

          <Text variant="headline" style={{ marginTop: spacing.m }}>
            Scan Food Item
          </Text>
          <Text
            variant="caption"
            color="secondary"
            style={{ textAlign: "center", marginTop: spacing.xs, maxWidth: 260 }}
          >
            Take a clear photo in good lighting to estimate shelf-life.
          </Text>

          <View style={{ marginTop: spacing.m, width: "100%" }}>
            <Button
              label={isScanning ? "Processing..." : "Select from Photos"}
              variant="secondary"
              small
              block
              loading={isScanning}
              onPress={handleLaunchCamera}
            />
          </View>
        </Card>

        {/* Expiring Soon Preview Section */}
        <View style={{ marginTop: spacing.xl }}>
          <View style={styles.sectionHeader}>
            <Text variant="title">Needs Attention</Text>
            {urgentItems.length > 0 && (
              <Badge label={`${urgentItems.length} Urgent`} variant="danger" />
            )}
          </View>

          {urgentItems.length === 0 ? (
            <Card style={{ marginTop: spacing.s, alignItems: "center", paddingVertical: spacing.l }}>
              <Text variant="headline">Fridge is Fresh</Text>
              <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
                No items are expiring in the next 48 hours.
              </Text>
            </Card>
          ) : (
            <View style={{ marginTop: spacing.s, gap: spacing.s }}>
              {urgentItems.slice(0, 3).map((item) => (
                <Card key={item.id} style={styles.urgentRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="headline">{item.fruit.name}</Text>
                    <Text variant="micro" color="secondary" style={{ marginTop: 2 }}>
                      Stored: {item.storage_method.replace("_", " ")}
                    </Text>
                  </View>
                  <Badge
                    daysLeft={item.days_left}
                    label={
                      item.days_left <= 0
                        ? "Expired"
                        : item.days_left <= 1
                          ? "Eat Today"
                          : `${Math.round(item.days_left)}d left`
                    }
                  />
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  shutterButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
