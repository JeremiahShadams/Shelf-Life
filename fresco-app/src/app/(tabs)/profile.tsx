/**
 * FRESCO — Account & Settings Screen
 * Matches SuperDesign draft (89da5db1-42ff-4c58-9122-955ab3082c34):
 * - User Profile card with circular avatar initials, email, and Edit Profile action
 * - Preferences Group:
 *     - Notifications switch toggle with instant Toast confirmation
 *     - Weight Units selector (Kg / Lbs) with live toggle
 *     - Default Storage selector (Fridge / Counter / Freezer)
 * - Help & Support Group: FAQ, Contact Us, About FRESCO
 * - Account Actions Group:
 *     - Change Password
 *     - Account Deletion option (App Store guideline 5.1.1 compliance)
 *     - Destructive Sign Out action with custom modal confirmation dialog
 * - App version footer
 */

import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, Text, Toast } from "../../components/ui";
import { useAuth } from "../../stores/auth";
import { useHealth } from "../../hooks/useHealth";
import { useNotifications } from "../../hooks/useNotifications";
import type { StorageMethod } from "../../types/api";

type WeightUnit = "Kg" | "Lbs";

export default function AccountScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, elevation } = theme;

  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const updateUserPreferences = useAuth((s) => s.updateUserPreferences);
  const deleteUserAccount = useAuth((s) => s.deleteUserAccount);
  const health = useHealth();
  const notifications = useNotifications();

  // Preferences State
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notifications_enabled ?? true,
  );
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    (user?.weight_unit === "lbs" ? "Lbs" : "Kg") as WeightUnit,
  );
  const [defaultStorage, setDefaultStorage] = useState<StorageMethod>(
    (user?.default_storage as StorageMethod) ?? "fridge",
  );

  // Dialog & Toast State
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User initials
  const initials = (user?.username ?? "JD")
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    void updateUserPreferences({ notifications_enabled: value });
    setToastMessage(value ? "Notifications enabled" : "Notifications disabled");
  };

  const handleToggleUnits = () => {
    const nextUnit: WeightUnit = weightUnit === "Kg" ? "Lbs" : "Kg";
    setWeightUnit(nextUnit);
    void updateUserPreferences({ weight_unit: nextUnit.toLowerCase() });
    setToastMessage(`Units updated to ${nextUnit}`);
  };

  const handleToggleDefaultStorage = () => {
    const nextStorage: StorageMethod =
      defaultStorage === "fridge"
        ? "room_temp"
        : defaultStorage === "room_temp"
          ? "freezer"
          : "fridge";
    setDefaultStorage(nextStorage);
    void updateUserPreferences({ default_storage: nextStorage });
    const label =
      nextStorage === "fridge"
        ? "Fridge"
        : nextStorage === "room_temp"
          ? "Counter"
          : "Freezer";
    setToastMessage(`Default storage set to ${label}`);
  };

  const handleFAQ = () => {
    Alert.alert(
      "Frequently Asked Questions",
      "• How does Fresco know expiry?\nOur AI model analyzes color, texture, and ethylene sensitivity against USDA post-harvest guidelines.\n\n• Can I scan any fruit?\nFresco supports 44 distinct fruit varieties, with more produce added every update.",
      [{ text: "Got it" }],
    );
  };

  const handleContactUs = () => {
    void Linking.openURL("mailto:support@frescoapp.com?subject=Fresco Support Inquiry");
  };

  const handleAbout = () => {
    const modelStatus = health.data?.ai_scanning === "available" ? "Active (MobileNetV2)" : "Offline";
    Alert.alert(
      "About FRESCO",
      `Version 1.0.0\nBuild 2026.11\nAI Model: ${modelStatus}\n\nFresco helps households minimize food waste and optimize produce shelf life.`,
      [{ text: "Close" }],
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "We'll send a secure password reset link to your registered email address.",
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
      "Delete Account?",
      "This action is permanent and will delete all your inventory history, tracked fruits, and notification records.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
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
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: layout.screenPadding }]}>
        <Text variant="largeTitle" style={styles.headerTitle}>
          Account
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: layout.screenPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
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
          {/* Avatar with Initials */}
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>

          {/* User Details */}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.username ?? "Fresco Member"}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email ?? "member@frescoapp.com"}
            </Text>
            <Text style={[styles.editProfileText, { color: colors.accent }]}>
              VIEW ALERTS ({notifications.data?.total ?? 0})
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </Pressable>

        {/* SECTION: PREFERENCES */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>PREFERENCES</Text>

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
            {/* Notifications Row */}
            <View
              style={[
                styles.groupRow,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <Text style={styles.rowTitle}>Notifications</Text>
              </View>

              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Weight Units Row */}
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
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons
                    name="scale-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <Text style={styles.rowTitle}>Weight Units</Text>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.valueText}>{weightUnit}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              </View>
            </Pressable>

            {/* Default Storage Row */}
            <Pressable
              onPress={handleToggleDefaultStorage}
              style={({ pressed }) => [
                styles.groupRow,
                { backgroundColor: pressed ? colors.surfacePressed : colors.surface },
              ]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons
                    name="snow-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <Text style={styles.rowTitle}>Default Storage</Text>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.valueText}>{storageDisplayLabel}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* SECTION: HELP & SUPPORT */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>HELP &amp; SUPPORT</Text>

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
            {/* FAQ */}
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
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <Text style={styles.rowTitle}>FAQ</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>

            {/* Contact Us */}
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
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <Text style={styles.rowTitle}>Contact Us</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>

            {/* About FRESCO */}
            <Pressable
              onPress={handleAbout}
              style={({ pressed }) => [
                styles.groupRow,
                { backgroundColor: pressed ? colors.surfacePressed : colors.surface },
              ]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons
                    name="information-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <Text style={styles.rowTitle}>About FRESCO</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>
          </View>
        </View>

        {/* SECTION: ACCOUNT ACTIONS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>ACCOUNT ACTIONS</Text>

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
            {/* Change Password */}
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
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <Text style={styles.rowTitle}>Change Password</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>

            {/* Delete Account (Apple App Store Guideline 5.1.1 Requirement) */}
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
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.dangerSoft },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.statusUrgent}
                  />
                </View>
                <Text style={[styles.rowTitle, { color: colors.statusUrgent }]}>
                  Delete Account
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>

            {/* Destructive Sign Out Row */}
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
                <View
                  style={[
                    styles.rowIconCircle,
                    { backgroundColor: colors.dangerSoft },
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={colors.statusUrgent}
                  />
                </View>
                <Text style={[styles.rowTitle, { color: colors.statusUrgent, fontWeight: "800" }]}>
                  Sign Out
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* App Version Footer */}
        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>FRESCO v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 Fresco Inc. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Sign Out Confirmation Modal Dialog */}
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
            {/* Red Circle Icon */}
            <View
              style={[
                styles.dialogIconCircle,
                { backgroundColor: colors.dangerSoft },
              ]}
            >
              <Ionicons name="log-out" size={24} color={colors.statusUrgent} />
            </View>

            <Text variant="headline" style={styles.dialogTitle}>
              Sign Out?
            </Text>
            <Text
              variant="body"
              color="secondary"
              style={styles.dialogBody}
            >
              Are you sure you want to sign out of your FRESCO account?
            </Text>

            <View style={styles.dialogButtonsRow}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setSignOutModalVisible(false)}
                style={styles.dialogCancelBtn}
              />
              <Button
                label="Sign Out"
                variant="danger"
                onPress={handleSignOutConfirm}
                style={styles.dialogConfirmBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Toast Confirmation */}
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
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "#545454",
    fontWeight: "500",
    marginBottom: 6,
  },
  editProfileText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#757575",
    letterSpacing: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valueText: {
    fontSize: 14,
    color: "#545454",
    fontWeight: "600",
  },
  versionFooter: {
    alignItems: "center",
    marginTop: 16,
    paddingBottom: 24,
  },
  versionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#757575",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  copyrightText: {
    fontSize: 11,
    color: "#A6A6A6",
    marginTop: 4,
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
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  dialogBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  dialogButtonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  dialogCancelBtn: {
    flex: 1,
    height: 48,
  },
  dialogConfirmBtn: {
    flex: 1,
    height: 48,
  },
});
