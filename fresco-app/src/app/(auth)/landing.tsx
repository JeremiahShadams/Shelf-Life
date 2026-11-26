/**
 * FRESCO — Onboarding Landing Screen
 * Proves product value in the first two seconds via an authentic produce verdict
 * preview card, pairs Fraunces brand typography with organic linen space, and
 * clearly discloses local-only persistence before the user enters guest mode.
 */

import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Badge, Button, Text } from "../../components/ui";
import { useAuth } from "../../stores/auth";
import { hapticLight } from "../../utils/haptics";
import { resolveLocalPlaceholder } from "../../utils/images";

export default function LandingScreen() {
  const theme = useTheme();
  const { colors, layout, radius, elevation, borders } = theme;
  const loginAsGuest = useAuth((s) => s.loginAsGuest);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartScanning = async () => {
    void hapticLight();
    setLoading(true);
    setError(null);
    try {
      await loginAsGuest();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: layout.screenPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          {/* Brand Header */}
          <View style={styles.brandRow}>
            <View
              style={[
                styles.brandEmblem,
                {
                  backgroundColor: colors.secondaryAction,
                  borderColor: colors.border,
                  borderRadius: radius.sm + 2,
                },
              ]}
            >
              <Ionicons name="leaf" size={20} color={colors.primary} />
            </View>
            <Text variant="wordmark" color="brand">
              fresco
            </Text>
          </View>

          <Text variant="headline" color="primary" align="center" style={styles.tagline}>
            Know what stays fresh — before it spoils.
          </Text>

          {/* Product Proof Card: shows real output in 2 seconds */}
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: borders.hairline,
                borderRadius: radius.modal,
              },
              elevation.card,
            ]}
          >
            <View style={styles.previewHeader}>
              <Image
                source={resolveLocalPlaceholder("berries")}
                style={[
                  styles.previewThumb,
                  {
                    backgroundColor: colors.backgroundMuted,
                    borderRadius: radius.sm + 2,
                  },
                ]}
              />
              <View style={styles.previewTitleCol}>
                <Badge label="Fresh" status="success" showDot />
                <Text variant="title" color="primary" style={styles.previewName}>
                  Roma Tomato
                </Text>
              </View>
              <View style={styles.previewDaysCol}>
                <Text variant="statusLarge" color="success">
                  10
                </Text>
                <Text variant="micro" color="success">
                  Days left
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.previewDetailsRow,
                {
                  backgroundColor: colors.backgroundMuted,
                  borderRadius: radius.card,
                },
              ]}
            >
              <Ionicons name="snow-outline" size={16} color={colors.primary} />
              <Text variant="caption" color="secondary" style={styles.previewTipText}>
                Best in the fridge. Keep separate from bananas so they don&apos;t over-ripen.
              </Text>
            </View>
          </View>

          {error && (
            <Text variant="caption" color="danger" align="center" style={styles.errorText}>
              {error}
            </Text>
          )}

          {/* Primary CTA */}
          <Button
            label="Scan Your First Fruit"
            variant="accent"
            block
            loading={loading}
            onPress={() => void handleStartScanning()}
            style={styles.ctaButton}
          />

          {/* Honest local storage disclosure BEFORE user enters guest mode */}
          <View
            style={[
              styles.guestNotice,
              {
                backgroundColor: colors.backgroundMuted,
                borderRadius: radius.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="phone-portrait-outline" size={16} color={colors.textSecondary} />
            <Text variant="micro" color="secondary" style={styles.guestNoticeText}>
              Starts without an account. Your fridge items stay saved on this device, though signing out or uninstalling clears them — sign in anytime for cloud backup.
            </Text>
          </View>

          {/* Sign In / Create Account Link */}
          <View style={styles.signInRow}>
            <Text variant="caption" color="secondary">
              Already have an account?
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(auth)/login")}
              style={styles.signInHitArea}
            >
              <Text variant="bodyStrong" color="brand" style={styles.signInLink}>
                Sign in
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 28,
  },
  heroContainer: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  brandEmblem: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tagline: {
    marginBottom: 24,
    maxWidth: 300,
  },
  previewCard: {
    width: "100%",
    padding: 16,
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  previewThumb: {
    width: 52,
    height: 52,
  },
  previewTitleCol: {
    flex: 1,
    gap: 4,
  },
  previewName: {
    marginTop: 2,
  },
  previewDaysCol: {
    alignItems: "flex-end",
  },
  previewDetailsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 8,
  },
  previewTipText: {
    flex: 1,
  },
  errorText: {
    marginBottom: 12,
  },
  ctaButton: {
    width: "100%",
  },
  guestNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
    width: "100%",
  },
  guestNoticeText: {
    flex: 1,
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 4,
  },
  signInHitArea: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  signInLink: {
    textDecorationLine: "underline",
  },
});
