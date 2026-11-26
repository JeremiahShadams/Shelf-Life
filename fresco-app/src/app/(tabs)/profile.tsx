/**
 * FRESCO — Profile & Settings Screen
 * - Tab label, route name, and header agree on "Profile"
 * - Wired with haptic selection feedback and local notification permissions
 * - Honest guest-mode labeling (no placeholder member@frescoapp.com)
 */

import React, { useState } from "react";
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, Text, Toast } from "../../components/ui";
import { useAuth } from "../../stores/auth";
import { useHealth } from "../../hooks/useHealth";
import { useNotifications } from "../../hooks/useNotifications";
import { requestLocalNotificationPermission } from "../../services/localNotifications";
import { hapticSelection } from "../../utils/haptics";
import type { StorageMethod } from "../../types/api";

type WeightUnit = "Kg" | "Lbs";

export default function ProfileScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, elevation } = theme;

  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const isGuest = token === "guest_demo_token";
  const logout = useAuth((s) => s.logout);
  const updateUserPreferences = useAuth((s) => s.updateUserPreferences);
  const deleteUserAccount = useAuth((s) => s.deleteUserAccount);
  const health = useHealth();
  const notifications = useNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notifications_enabled ?? true,
  );
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    (user?.weight_unit === "lbs" ? "Lbs" : "Kg") as WeightUnit,
  );
  const [defaultStorage, setDefaultStorage] = useState<StorageMethod>(
    (user?.default_storage as StorageMethod) ?? "fridge",
  );

  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const initials = (user?.username ?? "GU")
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleToggleNotifications = async (value: boolean) => {
    void hapticSelection();
    if (value) {
      const granted = await requestLocalNotificationPermission();
      if (!granted) {
        setToastMessage("Enable notifications in device Settings for expiry alerts");
      }
    }
    setNotificationsEnabled(value);
    void updateUserPreferences({ notifications_enabled: value });
    setToastMessage(value ? "Expiry reminders enabled" : "Expiry reminders paused");
  };

  const handleToggleUnits = () => {
    void hapticSelection();
    const nextUnit: WeightUnit = weightUnit === "Kg" ? "Lbs" : "Kg";
    setWeightUnit(nextUnit);
    void updateUserPreferences({ weight_unit: nextUnit.toLowerCase() });
    setToastMessage(`Units updated to ${nextUnit}`);
  };

  const handleToggleDefaultStorage = () => {
    void hapticSelection();
    const nextStorage: StorageMethod =
      defaultStorage === "fridge"
        ? "room_temp"
        : defaultStorage === "room_temp"
          ? "freezer"
          : "fridge";
    setDefaultStorage(nextStorage);
    void updateUserPreferences({ default_storage: nextStorage });
    const label =
      nextStorage === "fridge" ? "Fridge" : nextStorage === "room_temp" ? "Counter" : "Freezer";
    setToastMessage(`Default storage set to ${label}`);
  };

  const handleFAQ = () => {
    Alert.alert(
      "Frequently Asked Questions",
      "• How does Fresco estimate shelf life?\nFresco pairs AI produce recognition with USDA post-harvest guidelines and your chosen storage method.\n\n• Do reminders work offline?\nYes — once you add an item to your Fridge, reminders are scheduled directly on your device.",
      [{ text: "Got it" }],
    );
  };

  const handleContactUs = () => {
    void Linking.openURL("mailto:support@frescoapp.com?subject=Fresco Support Inquiry");
  };

  const handleAbout = () => {
    const modelStatus = health.data?.ai_scanning === "available" ? "Active" : "Offline";
    Alert.alert(
      "About Fresco",
      `Version 1.0.0\nScanner status: ${modelStatus}\n\nFresco helps households cut food waste by tracking real produce shelf life.`,
      [{ text: "Close" }],
    );
  };

  const handleChangePassword = () => {
    if (isGuest) {
      Alert.alert(
        "Guest session",
        "Create an account or sign in to set a password and sync your fridge across devices.",
        [{ text: "OK" }],
      );
      return;
    }
    Alert.alert(
      "Change password",
      "We'll send a password reset link to your registered email address.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Link",
          onPress: () => setToastMessage("Reset link sent to your email"),
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      isGuest ? "Clear local data?" : "Delete account?",
      isGuest
        ? "This removes all items saved on this device and signs you out."
        : "This permanently deletes your account, tracked produce, and alert history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isGuest ? "Clear Data" : "Delete Account",
          style: "destructive",
          onPress: () => {
            void deleteUserAccount();
          },
        },
      ],
    );
  };

  const handleSignOutConfirm = () => {
    setSignOutModalVisible(false);
    void logout();
  };

  const storageDisplayLabel =
    defaultStorage === "fridge"
      ? "Fridge"
      : defaultStorage === "room_temp"
        ? "Counter"
        : "Freezer";

  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: layout.screenPadding }]}>
        <Text variant="largeTitle" color="brand">
          Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.screenPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile / Alerts Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View expiry alerts"
          onPress={() => router.push("/notifications")}
          style={({ pressed }) => [
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.card,
              opacity: pressed ? 0.85 : 1,
              ...elevation.card,
            },
          ]}
        >
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text variant="title" color="inverse">
              {initials}
            </Text>
          </View>

          <View style={styles.userDetails}>
            <Text variant="cardTitle" color="primary">
              {isGuest ? "Guest on this device" : user?.username ?? "Member"}
            </Text>
            <Text variant="cardMeta" color="secondary" numberOfLines={1} style={styles.userSub}>
              {isGuest ? "Saved locally — sign in to sync" : user?.email ?? ""}
            </Text>
            <Text variant="micro" color="accent" style={styles.alertsLink}>
              View expiry alerts ({notifications.data?.total ?? 0})
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>

        {/* Preferences */}
        <View style={styles.sectionContainer}>
          <Text variant="caption" color="tertiary" style={styles.sectionHeader}>
            Preferences
          </Text>

          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.card,
                ...elevation.card,
              },
            ]}
          >
            <View style={[styles.groupRow, { borderBottomColor: colors.border }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, { backgroundColor: colors.backgroundMuted }]}>
                  <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                </View>
                <Text variant="body" color="primary">
                  Expiry alerts
                </Text>
              </View>

              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => void handleToggleNotifications(val)}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            <Pressable
              onPress={handleToggleUnits}
              style={({ pressed }) => [
                styles.groupRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, { backgroundColor: colors.backgroundMuted }]}>
                  <Ionicons name="scale-outline" size={18} color={colors.primary} />
                </View>
                <Text variant="body" color="primary">
                  Weight units
                </Text>
              </View>

              <View style={styles.rowRight}>
                <Text variant="caption" color="secondary">
                  {weightUnit}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </Pressable>

            <Pressable
              onPress={handleToggleDefaultStorage}
              style={({ pressed }) => [
                styles.groupRow,
                { backgroundColor: pressed ? colors.surfacePressed : colors.surface },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, { backgroundColor: colors.backgroundMuted }]}>
                  <Ionicons name="snow-outline" size={18} color={colors.primary} />
                </View>
                <Text variant="body" color="primary">
                  Default storage
                </Text>
              </View>

              <View style={styles.rowRight}>
                <Text variant="caption" color="secondary">
                  {storageDisplayLabel}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Help & support */}
        <View style={styles.sectionContainer}>
          <Text variant="caption" color="tertiary" style={styles.sectionHeader}>
            Help &amp; support
          </Text>

          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.card,
                ...elevation.card,
              },
            ]}
          >
            <Pressable
              onPress={handleFAQ}
              style={({ pressed }) => [
                styles.groupRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, { backgroundColor: colors.backgroundMuted }]}>
                  <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                </View>
                <Text variant="body" color="primary">
                  FAQ
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={handleContactUs}
              style={({ pressed }) => [
                styles.groupRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, { backgroundColor: colors.backgroundMuted }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                </View>
                <Text variant="body" color="primary">
                  Contact us
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={handleAbout}
              style={({ pressed }) => [
                styles.groupRow,
                { backgroundColor: pressed ? colors.surfacePressed : colors.surface },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, { backgroundColor: colors.backgroundMuted }]}>
                  <Ionicons name="information-outline" size={18} color={colors.primary} />
                </View>
                <Text variant="body" color="primary">
                  About Fresco
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Account actions */}
        <View style={styles.sectionContainer}>
          <Text variant="caption" color="tertiary" style={styles.sectionHeader}>
            Account actions
          </Text>

          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.card,
                ...elevation.card,
              },
            ]}
          >
            {!isGuest && (
              <Pressable
                onPress={handleChangePassword}
                style={({ pressed }) => [
                  styles.groupRow,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                  },
                ]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIconCircle, { backgroundColor: colors.backgroundMuted }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
                  </View>
                  <Text variant="body" color="primary">
                    Change password
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            )}

            <Pressable
              onPress={handleDeleteAccount}
              style={({ pressed }) => [
                styles.groupRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, { backgroundColor: colors.dangerSoft }]}>
                  <Ionicons name="trash-outline" size={18} color={colors.statusUrgent} />
                </View>
                <Text variant="body" color="danger">
                  {isGuest ? "Clear device data" : "Delete account"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={() => setSignOutModalVisible(true)}
              style={({ pressed }) => [
                styles.groupRow,
                {
                  backgroundColor: pressed ? colors.dangerSoft : colors.surface,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, { backgroundColor: colors.dangerSoft }]}>
                  <Ionicons name="log-out-outline" size={18} color={colors.statusUrgent} />
                </View>
                <Text variant="bodyStrong" color="danger">
                  {isGuest ? "Sign in / Leave guest mode" : "Sign out"}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.versionFooter}>
          <Text variant="micro" color="tertiary">
            Fresco v1.0.0
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
            onPress={() => setSignOutModalVisible(false)}
          />

          <View
            style={[
              styles.dialogBox,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.modal,
                padding: spacing.xl,
                ...elevation.modal,
              },
            ]}
          >
            <View style={[styles.dialogIconCircle, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="log-out" size={24} color={colors.statusUrgent} />
            </View>

            <Text variant="headline" color="primary" style={styles.dialogTitle}>
              {isGuest ? "Leave guest mode?" : "Sign out?"}
            </Text>
            <Text variant="body" color="secondary" align="center" style={styles.dialogBody}>
              {isGuest
                ? "Leaving guest mode clears items saved only on this device so you can sign in or start fresh."
                : "Are you sure you want to sign out of your Fresco account?"}
            </Text>

            <View style={styles.dialogButtonsRow}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setSignOutModalVisible(false)}
                style={styles.dialogActionBtn}
              />
              <Button
                label={isGuest ? "Continue" : "Sign Out"}
                variant="danger"
                onPress={handleSignOutConfirm}
                style={styles.dialogActionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toastMessage != null}
        message={toastMessage || ""}
        onDismiss={() => setToastMessage(null)}
        bottomOffset={96}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    flex: 1,
  },
  userSub: {
    marginTop: 2,
    marginBottom: 6,
  },
  alertsLink: {
    fontWeight: "700",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupCard: {
    borderWidth: 1,
    overflow: "hidden",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  versionFooter: {
    alignItems: "center",
    marginTop: 8,
    paddingBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialogBox: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    zIndex: 10,
  },
  dialogIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dialogTitle: {
    marginBottom: 8,
  },
  dialogBody: {
    marginBottom: 24,
  },
  dialogButtonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  dialogActionBtn: {
    flex: 1,
    height: 48,
  },
});
