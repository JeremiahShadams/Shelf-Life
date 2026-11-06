/**
 * FRESCO — Onboarding Landing Screen
 * Matches SuperDesign draft (964b5255-1f4c-476c-8633-d55abf5e1271):
 * - Centered lowercase 'fresco' title
 * - "Know your fruit." tagline
 * - 56px solid black CTA "Scan Your First Fruit"
 * - "Already have an account? Sign in" navigation link
 */

import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, Text } from "../../components/ui";
import { useAuth } from "../../stores/auth";

export default function LandingScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;
  const loginAsGuest = useAuth((s) => s.loginAsGuest);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartScanning = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAsGuest();
      // AuthGate navigates to home tabs
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: layout.screenPadding }]}>
        {/* Centered Brand Content */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandLogo}>fresco</Text>
          <Text style={styles.tagline}>Know your fruit.</Text>

          {error && (
            <Text variant="caption" color="danger" style={styles.errorText}>
              {error}
            </Text>
          )}

          {/* Primary CTA */}
          <Button
            label="Scan Your First Fruit"
            variant="primary"
            block
            loading={loading}
            onPress={handleStartScanning}
            style={styles.ctaButton}
          />

          {/* Sign In Link */}
          <View style={styles.signInRow}>
            <Text variant="body" color="secondary" style={styles.accountText}>
              Already have an account?
            </Text>
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              hitSlop={8}
            >
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandContainer: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    marginTop: -40,
  },
  brandLogo: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 6,
    color: "#000000",
  },
  tagline: {
    fontSize: 16,
    fontWeight: "500",
    color: "#545454",
    marginBottom: 36,
  },
  errorText: {
    marginBottom: 16,
    textAlign: "center",
  },
  ctaButton: {
    width: "100%",
    height: 56,
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    gap: 6,
  },
  accountText: {
    fontSize: 14,
    color: "#545454",
  },
  signInLink: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000000",
    textDecorationLine: "underline",
  },
});
