/**
 * Fresco — Sign in
 * One job: get an existing account into the app. Errors are shown where
 * they happened (field-level for validation, form-level for the API).
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

export default function LoginScreen() {
  const theme = useTheme();
  const { spacing, layout, colors } = theme;
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (password.length === 0) {
      setFormError("Enter your password.");
      return;
    }

    setEmailError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await login(trimmedEmail, password);
      // AuthGate flips the route tree to the tabs on success.
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't sign in. Try again.");
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
            <Text variant="largeTitle">Welcome back</Text>
            <Text variant="body" color="secondary" style={{ marginTop: spacing.s }}>
              Sign in to keep track of what&apos;s fresh.
            </Text>
          </View>

          <View style={{ marginTop: spacing.xl, gap: spacing.m }}>
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
                if (formError) setFormError(null);
              }}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
            />
          </View>

          {formError != null && (
            <Text variant="caption" color="danger" style={{ marginTop: spacing.m }}>
              {formError}
            </Text>
          )}

          <Button
            label="Sign in"
            block
            loading={submitting}
            onPress={() => void handleSubmit()}
            style={{ marginTop: spacing.l }}
          />

          <Button
            label="Create an account"
            variant="ghost"
            block
            disabled={submitting}
            onPress={() => router.push("/(auth)/register")}
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
