/**
 * Fresco — Create account
 * Mirrors the backend's rules exactly (username charset, password policy),
 * so most mistakes are caught before a round-trip.
 */

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, Input, Text } from "../../components/ui";
import { useAuth } from "../../stores/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,50}$/;

export default function RegisterScreen() {
  const theme = useTheme();
  const { spacing, layout, colors } = theme;
  const register = useAuth((s) => s.register);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    let ok = true;

    if (!USERNAME_RE.test(username.trim())) {
      setUsernameError("3–50 characters: letters, numbers, or underscores.");
      ok = false;
    } else {
      setUsernameError(null);
    }

    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      ok = false;
    } else {
      setEmailError(null);
    }

    if (password.length < 8) {
      setPasswordError("At least 8 characters.");
      ok = false;
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordError("Include at least one letter and one number.");
      ok = false;
    } else {
      setPasswordError(null);
    }

    return ok;
  }

  async function handleSubmit() {
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
      // AuthGate flips the route tree to the tabs on success.
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't create your account. Try again.");
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
            styles.content,
            { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginTop: spacing.xxl }}>
            <Text variant="largeTitle">Create account</Text>
            <Text variant="body" color="secondary" style={{ marginTop: spacing.s }}>
              Track what you buy and know what to eat first.
            </Text>
          </View>

          <View style={{ marginTop: spacing.xl, gap: spacing.m }}>
            <Input
              label="Username"
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                if (usernameError) setUsernameError(null);
              }}
              placeholder="your_name"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              error={usernameError}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (emailError) setEmailError(null);
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              error={emailError}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              error={passwordError}
              hint="8+ characters, with a letter and a number."
            />
          </View>

          {formError != null && (
            <Text variant="caption" color="danger" style={{ marginTop: spacing.m }}>
              {formError}
            </Text>
          )}

          <Button
            label="Create account"
            block
            loading={submitting}
            onPress={() => void handleSubmit()}
            style={{ marginTop: spacing.l }}
          />

          <Button
            label="I already have an account"
            variant="ghost"
            block
            disabled={submitting}
            onPress={() => router.back()}
            style={{ marginTop: spacing.s }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center" },
});
