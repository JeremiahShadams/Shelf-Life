/**
 * FRESCO — Sign In Screen
 * Matches SuperDesign draft (2bea37e9-a298-484a-b1cc-a4d4ca32248e):
 * - Centered lowercase 'fresco' header + 'Welcome back'
 * - Soft-red inline error alert banner with alert-circle icon
 * - 56px Uber Base form inputs with eye password visibility toggle
 * - 56px solid black "Sign In" CTA
 * - "Don't have an account? Sign up" navigation link
 */

import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, Text } from "../../components/ui";
import { useAuth } from "../../stores/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius } = theme;
  const login = useAuth((s) => s.login);
  const loginAsGuest = useAuth((s) => s.loginAsGuest);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGuestLogin() {
    setSubmitting(true);
    try {
      await loginAsGuest();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't continue as guest.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!EMAIL_RE.test(trimmedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password.length === 0) {
      setFormError("Enter your password.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await login(trimmedEmail, password);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Invalid email or password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: layout.screenPadding },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>fresco</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome back</Text>
            </View>

            {/* Error Alert Banner */}
            {formError != null && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.dangerSoft,
                    borderColor: colors.statusUrgent,
                    borderRadius: radius.card,
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={colors.statusUrgent}
                  style={styles.errorIcon}
                />
                <Text
                  style={[styles.errorText, { color: colors.statusUrgent }]}
                >
                  {formError}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.fieldsGroup}>
              {/* Email */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (formError) setFormError(null);
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.backgroundMuted,
                      borderColor: focusedField === "email" ? colors.primary : "transparent",
                      color: colors.textPrimary,
                      borderRadius: radius.card,
                    },
                  ]}
                />
              </View>

              {/* Password */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (formError) setFormError(null);
                    }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    textContentType="password"
                    style={[
                      styles.textInput,
                      styles.passwordInput,
                      {
                        backgroundColor: colors.backgroundMuted,
                        borderColor: focusedField === "password" ? colors.primary : "transparent",
                        color: colors.textPrimary,
                        borderRadius: radius.card,
                      },
                    ]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <Button
              label="Sign In"
              variant="primary"
              block
              loading={submitting}
              onPress={() => void handleSubmit()}
              style={styles.submitBtn}
            />

            {/* Guest Exploration Option */}
            <Button
              label="Explore as Guest"
              variant="secondary"
              block
              disabled={submitting}
              onPress={() => void handleGuestLogin()}
              style={styles.guestBtn}
            />

            {/* Footer Sign Up Link */}
            <View style={styles.footerRow}>
              <Text variant="body" color="secondary" style={styles.footerText}>
                Don&apos;t have an account?
              </Text>
              <Pressable
                onPress={() => router.push("/(auth)/register")}
                hitSlop={8}
              >
                <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 32,
  },
  formContainer: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  errorIcon: {
    marginTop: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  fieldsGroup: {
    gap: 18,
    marginBottom: 24,
  },
  fieldWrapper: {},
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  textInput: {
    height: 56,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "500",
    borderWidth: 1.5,
  },
  passwordRow: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    height: 44,
    justifyContent: "center",
  },
  submitBtn: {
    height: 56,
  },
  guestBtn: {
    height: 56,
    marginTop: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
