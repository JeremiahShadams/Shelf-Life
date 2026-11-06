/**
 * FRESCO — Scan (Home Screen)
 * Matches SuperDesign draft (f07b204d-974f-4128-a3fc-113f0b3e6323):
 * - Header with lowercase 'fresco' branding + [Camera | Upload] mode pill
 * - 4:3 rounded viewfinder card with 4 white corner guide brackets
 * - Concentric shutter ring button overlayed inside viewfinder
 * - Pre-storage selector: "Where will you store it?" (Counter, Fridge, Freezer)
 * - Post-capture review state: [Retake] + [Scan This Fruit]
 * - 3-stage progressive ProcessingOverlay during AI classification
 */

import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, ErrorState, Loading, ProcessingOverlay, Text } from "../../components/ui";
import { isModelNotDeployed, scanImage, type ScanAsset } from "../../services/scan";
import type { StorageMethod } from "../../types/api";

const STORAGE_OPTIONS: { key: StorageMethod; label: string }[] = [
  { key: "room_temp", label: "Counter" },
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Freezer" },
];

function fileName(uri: string, fallback: string): string {
  const tail = uri.split("/").pop();
  return tail && tail.includes(".") ? tail : fallback;
}

export default function ScanScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, elevation } = theme;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [focused, setFocused] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelMissing, setModelMissing] = useState(false);

  // Storage location preference before scanning
  const [preStorage, setPreStorage] = useState<StorageMethod>("fridge");

  // Captured photo preview before uploading
  const [capturedAsset, setCapturedAsset] = useState<ScanAsset | null>(null);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setCameraReady(false);
      };
    }, []),
  );

  async function upload(asset: ScanAsset) {
    setBusy(true);
    setError(null);
    setModelMissing(false);

    try {
      const result = await scanImage(asset);
      // Pass the user's preselected storage method into result
      if (preStorage && result.estimated_shelf_life[preStorage] != null) {
        result.best_storage = preStorage;
      }

      router.push({
        pathname: "/scan-result",
        params: { scan: JSON.stringify(result) },
      });
      // Clear review state after navigating
      setCapturedAsset(null);
    } catch (err) {
      if (isModelNotDeployed(err)) {
        setModelMissing(true);
      } else {
        setError(
          err instanceof Error ? err.message : "Couldn't scan that photo. Try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady || busy) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) {
        setError("Couldn't capture that photo. Try again.");
        return;
      }
      const asset: ScanAsset = {
        uri: photo.uri,
        name: fileName(photo.uri, "scan.jpg"),
        mimeType: "image/jpeg",
      };
      setCapturedAsset(asset);
    } catch {
      setError("Couldn't capture that photo. Try again.");
    }
  }

  async function handlePick() {
    if (busy) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled) return;

      const picked = result.assets[0];
      const asset: ScanAsset = {
        uri: picked.uri,
        name: picked.fileName ?? fileName(picked.uri, "scan.jpg"),
        mimeType: picked.mimeType ?? "image/jpeg",
      };
      setCapturedAsset(asset);
    } catch {
      setError("Couldn't open photo library.");
    }
  }

  const handleRetake = () => {
    setCapturedAsset(null);
    setError(null);
  };

  const handleScanCaptured = () => {
    if (capturedAsset) {
      void upload(capturedAsset);
    }
  };

  // Permission still loading
  if (permission == null) {
    return <Loading fullScreen style={{ backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {/* Header with fresco logo & [Camera | Upload] toggle */}
      <View style={[styles.header, { paddingHorizontal: layout.screenPadding }]}>
        <Text style={styles.brandTitle}>fresco</Text>

        <View
          style={[
            styles.headerModeToggle,
            { backgroundColor: colors.backgroundMuted },
          ]}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: capturedAsset == null }}
            onPress={handleRetake}
            style={[
              styles.modeSegment,
              capturedAsset == null && [
                styles.modeSegmentActive,
                { backgroundColor: colors.primary },
              ],
            ]}
          >
            <Text
              style={[
                styles.modeSegmentText,
                {
                  color: capturedAsset == null ? colors.primaryText : colors.textSecondary,
                  fontWeight: capturedAsset == null ? "700" : "500",
                },
              ]}
            >
              Camera
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: capturedAsset != null }}
            onPress={() => void handlePick()}
            style={[
              styles.modeSegment,
              capturedAsset != null && [
                styles.modeSegmentActive,
                { backgroundColor: colors.primary },
              ],
            ]}
          >
            <Text
              style={[
                styles.modeSegmentText,
                {
                  color: capturedAsset != null ? colors.primaryText : colors.textSecondary,
                  fontWeight: capturedAsset != null ? "700" : "500",
                },
              ]}
            >
              Upload
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: layout.screenPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Denied Warning Card */}
        {!permission.granted && (
          <View
            style={[
              styles.inlineErrorBox,
              {
                backgroundColor: colors.dangerSoft,
                borderColor: colors.statusUrgent,
                borderRadius: radius.card,
              },
            ]}
          >
            <Ionicons
              name="alert-circle"
              size={20}
              color={colors.statusUrgent}
              style={styles.errorIcon}
            />
            <View style={styles.errorTextCol}>
              <Text
                style={[styles.errorHeading, { color: colors.statusUrgent }]}
              >
                Camera permission denied
              </Text>
              <Text
                variant="caption"
                style={[styles.errorSub, { color: colors.textSecondary }]}
              >
                Enable camera access in settings or upload a photo instead.
              </Text>
              <Pressable
                onPress={() => {
                  if (permission.canAskAgain) void requestPermission();
                  else void Linking.openSettings();
                }}
                style={styles.permissionActionBtn}
              >
                <Text style={styles.permissionActionText}>
                  {permission.canAskAgain ? "Allow Camera" : "Open Settings"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Scan Error Message */}
        {error && (
          <View
            style={[
              styles.inlineErrorBox,
              {
                backgroundColor: colors.dangerSoft,
                borderColor: colors.statusUrgent,
                borderRadius: radius.card,
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.statusUrgent}
              style={styles.errorIcon}
            />
            <Text
              variant="caption"
              style={[styles.errorHeading, { color: colors.statusUrgent, flex: 1 }]}
            >
              {error}
            </Text>
            <Pressable onPress={() => setError(null)} hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.statusUrgent} />
            </Pressable>
          </View>
        )}

        {/* Model Missing Banner */}
        {modelMissing && (
          <View
            style={[
              styles.inlineErrorBox,
              {
                backgroundColor: colors.statusWarningSoft,
                borderColor: colors.statusWarning,
                borderRadius: radius.card,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.statusWarning}
              style={styles.errorIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.errorHeading, { color: colors.textPrimary }]}>
                Scanning model warming up
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                You can still add produce manually by name in the meantime.
              </Text>
              <Pressable
                onPress={() => router.push("/add-item")}
                style={{ marginTop: 6 }}
              >
                <Text style={[styles.permissionActionText, { color: colors.textPrimary }]}>
                  Add item by name →
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 4:3 Viewfinder Area Card with Reticle Brackets */}
        <View
          style={[
            styles.viewfinderCard,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.modal,
              ...elevation.card,
            },
          ]}
        >
          {/* Active Camera Stream or Captured Photo */}
          {capturedAsset ? (
            <Image
              source={{ uri: capturedAsset.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            focused &&
            permission.granted && (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                onCameraReady={() => setCameraReady(true)}
                onMountError={() => setError("Camera failed to start.")}
              />
            )
          )}

          {/* Camera Starting Spinner */}
          {!capturedAsset && !cameraReady && permission.granted && (
            <View style={[StyleSheet.absoluteFill, styles.cameraLoadingOverlay]}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.cameraLoadingText}>Starting camera...</Text>
            </View>
          )}

          {/* 4 Corner Guide Reticle Brackets */}
          <View pointerEvents="none" style={styles.reticleContainer}>
            <View style={styles.reticleTopLeft} />
            <View style={styles.reticleTopRight} />
            <View style={styles.reticleBottomLeft} />
            <View style={styles.reticleBottomRight} />
          </View>

          {/* Concentric Shutter Button Overlay (Inside Viewfinder) */}
          {!capturedAsset && permission.granted && (
            <View style={styles.shutterOverlay}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Capture fruit photo"
                disabled={!cameraReady || busy}
                onPress={handleCapture}
                style={({ pressed }) => [
                  styles.shutterOuterRing,
                  {
                    opacity: !cameraReady || busy ? 0.4 : pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  },
                ]}
              >
                <View style={styles.shutterInnerCircle} />
              </Pressable>
            </View>
          )}

          {/* Flashlight Torch Toggle (Bottom-Right of viewfinder) */}
          {!capturedAsset && permission.granted && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torch ? "Turn off flash" : "Turn on flash"}
              onPress={() => setTorch((v) => !v)}
              style={({ pressed }) => [
                styles.torchButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name={torch ? "flash" : "flash-outline"}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          )}
        </View>

        {/* Post-Capture Review Actions: [Retake] + [Scan This Fruit] */}
        {capturedAsset && (
          <View style={styles.reviewActionsRow}>
            <Button
              label="Retake"
              variant="secondary"
              onPress={handleRetake}
              style={styles.retakeBtn}
            />
            <Button
              label="Scan This Fruit"
              variant="primary"
              loading={busy}
              onPress={handleScanCaptured}
              style={styles.scanCapturedBtn}
            />
          </View>
        )}

        {/* Storage Pre-Selector Section */}
        <View style={styles.storageSelectorSection}>
          <Text style={styles.storageLabel}>WHERE WILL YOU STORE IT?</Text>
          <View
            style={[
              styles.storageSegmentContainer,
              { backgroundColor: colors.backgroundMuted },
            ]}
          >
            {STORAGE_OPTIONS.map((opt) => {
              const isSelected = preStorage === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setPreStorage(opt.key)}
                  style={[
                    styles.storageSegment,
                    isSelected && [
                      styles.storageSegmentActive,
                      {
                        backgroundColor: colors.surface,
                        ...elevation.card,
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.storageSegmentText,
                      {
                        color: isSelected ? colors.textPrimary : colors.textSecondary,
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.storageHint}>
            This helps us estimate shelf life more accurately.
          </Text>
        </View>
      </ScrollView>

      {/* 3-Stage Progressive Processing Overlay */}
      <ProcessingOverlay
        visible={busy}
        onCancel={() => setBusy(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  headerModeToggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
  },
  modeSegment: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9,
  },
  modeSegmentActive: {},
  modeSegmentText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  inlineErrorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorIcon: {
    marginTop: 2,
  },
  errorTextCol: {
    flex: 1,
  },
  errorHeading: {
    fontSize: 13,
    fontWeight: "700",
  },
  errorSub: {
    marginTop: 2,
    lineHeight: 16,
  },
  permissionActionBtn: {
    marginTop: 6,
  },
  permissionActionText: {
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  viewfinderCard: {
    width: "100%",
    aspectRatio: 4 / 3,
    overflow: "hidden",
    position: "relative",
    marginBottom: 20,
  },
  cameraLoadingOverlay: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  cameraLoadingText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
  reticleContainer: {
    ...StyleSheet.absoluteFill,
    margin: 16,
  },
  reticleTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderTopLeftRadius: 6,
  },
  reticleTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderTopRightRadius: 6,
  },
  reticleBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderBottomLeftRadius: 6,
  },
  reticleBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderBottomRightRadius: 6,
  },
  shutterOverlay: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  torchButton: {
    position: "absolute",
    bottom: 22,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  retakeBtn: {
    flex: 1,
    height: 56,
  },
  scanCapturedBtn: {
    flex: 2,
    height: 56,
  },
  storageSelectorSection: {
    marginTop: 4,
  },
  storageLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#545454",
    letterSpacing: 1,
    marginBottom: 8,
  },
  storageSegmentContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
  },
  storageSegment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  storageSegmentActive: {},
  storageSegmentText: {
    fontSize: 14,
  },
  storageHint: {
    fontSize: 12,
    color: "#545454",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 10,
  },
});
