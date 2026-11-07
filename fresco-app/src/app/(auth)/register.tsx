/**
 * FRESCO — Sign Up Screen
 * Matches SuperDesign draft (5f3b4511-965a-44a4-9f3f-b444552e5988):
 * - Centered lowercase 'fresco' header + 'Create your account'
 * - Soft-red inline error alert banner
 * - 4-field registration: Username, Email, Password, Confirm Password
 * - Interactive 3-Bar Password Strength Meter (Weak Red / Fair Amber / Strong Green)
 * - Independent eye visibility toggles for passwords
 * - 56px solid black "Create Account" CTA
 * - "Already have an account? Sign in" navigation link
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
const USERNAME_RE = /^[a-zA-Z0-9_]{3,50}$/;

export default function RegisterScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius } = theme;
  const register = useAuth((s) => s.register);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd || pwd.length === 0) {
      return { score: 0, label: "Must be at least 6 characters", color: colors.textSecondary };
    }
    if (pwd.length < 6) {
      return { score: 1, label: "Weak — too short", color: colors.statusUrgent };
    }

    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (hasLetter && hasNumber && hasSpecial && pwd.length >= 8) {
      return { score: 3, label: "Strong password", color: colors.statusSuccess };
    }
    if ((hasLetter && hasNumber) || pwd.length >= 8) {
      return { score: 2, label: "Fair password", color: colors.statusWarning };
    }
    return { score: 1, label: "Weak password", color: colors.statusUrgent };
  };

  const strength = getPasswordStrength(password);

  function validate(): boolean {
    if (!USERNAME_RE.test(username.trim())) {
      setFormError("Username must be 3–50 letters, numbers, or underscores.");
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFormError("Enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Couldn't create account. Try again.",
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
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create your account</Text>
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
                <Text style={[styles.errorText, { color: colors.statusUrgent }]}>
                  {formError}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.fieldsGroup}>
              {/* Username */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={(v) => {
                    setUsername(v);
                    if (formError) setFormError(null);
                  }}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="john_doe"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.backgroundMuted,
                      borderColor: focusedField === "username" ? colors.primary : "transparent",
                      color: colors.textPrimary,
                      borderRadius: radius.card,
                    },
                  ]}
                />
              </View>

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
                    placeholder="Min 6 characters"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
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

                {/* 3-Bar Interactive Strength Meter */}
                <View style={styles.strengthBarsRow}>
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength.score >= 1 ? strength.color : colors.borderStrong,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength.score >= 2 ? strength.color : colors.borderStrong,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength.score >= 3 ? strength.color : colors.borderStrong,
                      },
                    ]}
                  />
                </View>

                <Text
                  variant="caption"
                  style={[styles.strengthLabel, { color: strength.color }]}
                >
                  {strength.label}
                </Text>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(v) => {
                      setConfirmPassword(v);
                      if (formError) setFormError(null);
                    }}
                    onFocus={() => setFocusedField("confirm")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Repeat password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    textContentType="newPassword"
                    style={[
                      styles.textInput,
                      styles.passwordInput,
                      {
                        backgroundColor: colors.backgroundMuted,
                        borderColor: focusedField === "confirm" ? colors.primary : "transparent",
                        color: colors.textPrimary,
                        borderRadius: radius.card,
                      },
                    ]}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    hitSlop={8}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <Button
              label="Create Account"
              variant="primary"
              block
              loading={submitting}
              onPress={() => void handleSubmit()}
              style={styles.submitBtn}
            />

            {/* Footer Sign In Link */}
            <View style={styles.footerRow}>
              <Text variant="body" color="secondary" style={styles.footerText}>
                Already have an account?
              </Text>
              <Pressable
                onPress={() => router.push("/(auth)/login")}
                hitSlop={8}
              >
                <Text style={[styles.signInLink, { color: colors.primary }]}>Sign in</Text>
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
    marginBottom: 24,
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
    gap: 16,
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
  strengthBarsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  submitBtn: {
    height: 56,
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
  signInLink: {
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
