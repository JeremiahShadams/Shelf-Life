/**
 * FRESCO — Scan (Home Screen)
 * High-performance, full-viewport produce scanner.
 * - Tall, immersive camera viewfinder on organic linen canvas
 * - Clean tactile bottom controls: Gallery | 78px Shutter (with haptic feedback) | Torch
 * - Resizes captures to 512px before upload to protect mobile data
 * - AbortController wired directly to ProcessingOverlay.onCancel so users are never trapped
 * - >= 44x44pt accessible touch targets on every button
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, ErrorState, Loading, ProcessingOverlay, Text } from "../../components/ui";
import { useHealth } from "../../hooks/useHealth";
import { classifyScanError, scanImage, type ScanAsset } from "../../services/scan";
import { hapticMedium, hapticSelection } from "../../utils/haptics";

function fileName(uri: string, fallback: string): string {
  const tail = uri.split("/").pop();
  return tail && tail.includes(".") ? tail : fallback;
}

export default function ScanScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, elevation } = theme;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const scanAbortRef = useRef<AbortController | null>(null);

  const health = useHealth();
  const serverUnreachable = health.isError;
  const modelUnavailable = health.data?.ai_scanning === "unavailable";

  const [focused, setFocused] = useState(true);
  const [cameraKey, setCameraKey] = useState(0);
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelMissing, setModelMissing] = useState(false);

  const [reviewAsset, setReviewAsset] = useState<ScanAsset | null>(null);
  const [lastAsset, setLastAsset] = useState<ScanAsset | null>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      setCameraKey((prev) => prev + 1);
      return () => {
        setFocused(false);
        scanAbortRef.current?.abort();
      };
    }, []),
  );

  function handleCancelScan() {
    scanAbortRef.current?.abort();
    scanAbortRef.current = null;
    setBusy(false);
    setReviewAsset(null);
  }

  async function upload(asset: ScanAsset) {
    scanAbortRef.current?.abort();
    const controller = new AbortController();
    scanAbortRef.current = controller;

    setBusy(true);
    setError(null);
    setModelMissing(false);
    setLastAsset(asset);

    try {
      const result = await scanImage(asset, controller.signal);
      if (controller.signal.aborted) return;

      setReviewAsset(null);
      setLastAsset(null);
      router.push({
        pathname: "/scan-result",
        params: { scan: JSON.stringify(result) },
      });
    } catch (err) {
      const kind = classifyScanError(err);
      if (kind === "cancelled") {
        // Explicit user cancellation: return cleanly to live camera
        return;
      } else if (kind === "model_unavailable") {
        setModelMissing(true);
      } else if (kind === "not_recognized") {
        setError("We couldn't identify that item. Center one fruit in bright light and try again.");
      } else if (kind === "offline") {
        setError("Couldn't reach Fresco — check your connection and try again.");
      } else {
        setError("Couldn't analyze that photo. Hold steady and try again.");
      }
      setReviewAsset(null);
    } finally {
      if (scanAbortRef.current === controller) {
        scanAbortRef.current = null;
      }
      setBusy(false);
    }
  }

  function retryScan() {
    if (lastAsset == null || busy) return;
    setReviewAsset(lastAsset);
    void upload(lastAsset);
  }

  async function handleCapture() {
    if (!cameraRef.current || busy) return;
    void hapticMedium();
    try {
      setBusy(true);
      setError(null);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (!photo || !photo.uri) {
        setError("Couldn't capture photo. Tap the shutter to try again.");
        setBusy(false);
        return;
      }
      const asset: ScanAsset = {
        uri: photo.uri,
        name: fileName(photo.uri, "scan.jpg"),
        mimeType: "image/jpeg",
      };
      setReviewAsset(asset);
      await upload(asset);
    } catch (err) {
      console.warn("Capture error:", err);
      setError("Couldn't take photo. Tap the shutter again.");
      setReviewAsset(null);
      setBusy(false);
    }
  }

  async function handlePick() {
    if (busy) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled || !result.assets[0]) return;

      const picked = result.assets[0];
      const pickedMime = (picked.mimeType ?? "").toLowerCase();
      if (pickedMime === "image/heic" || pickedMime === "image/heif" || /\.hei[cf]$/i.test(picked.uri)) {
        setError("HEIC photos aren't supported. Choose a JPEG/PNG or use the in-app camera.");
        return;
      }

      const asset: ScanAsset = {
        uri: picked.uri,
        name: picked.fileName ?? fileName(picked.uri, "scan.jpg"),
        mimeType: picked.mimeType ?? "image/jpeg",
      };
      setReviewAsset(asset);
      await upload(asset);
    } catch {
      setError("Couldn't open your photo library.");
      setReviewAsset(null);
    }
  }

  if (permission == null) {
    return <Loading fullScreen style={{ backgroundColor: colors.background }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.permissionContainer, { paddingHorizontal: layout.screenPadding }]}>
          <View style={[styles.permissionIconCircle, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="camera" size={40} color={colors.primary} />
          </View>
          <Text variant="largeTitle" color="primary" align="center" style={styles.permissionTitle}>
            Camera access
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.permissionBody}>
            Fresco uses your camera to identify produce and estimate how many fresh days remain.
          </Text>

          <Button
            label={permission.canAskAgain ? "Enable Camera" : "Open Settings"}
            variant="primary"
            block
            onPress={() => {
              if (permission.canAskAgain) void requestPermission();
              else void Linking.openSettings();
            }}
            style={{ marginTop: spacing.xl }}
          />

          <Button
            label="Upload photo instead"
            variant="secondary"
            block
            onPress={() => void handlePick()}
            style={{ marginTop: spacing.s }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (modelMissing) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          full
          title="Scanner temporarily offline"
          message="The AI produce model isn't available right now. You can add your fruit by name and track expiry."
          retryLabel="Add Item Manually"
          onRetry={() => router.push("/add-item")}
        />
        <View style={{ paddingHorizontal: layout.screenPadding, paddingBottom: spacing.l }}>
          <Button
            label="Try another photo"
            variant="ghost"
            block
            onPress={() => {
              setModelMissing(false);
              void handlePick();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingHorizontal: layout.screenPadding }]}>
        <View style={styles.headerTextCol}>
          <Text variant="largeTitle" color="brand">
            Scan
          </Text>
          <Text variant="caption" color="secondary" style={styles.headerSubtitle}>
            Point at one piece of produce.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add fruit by name"
          onPress={() => router.push("/add-item")}
          style={({ pressed }) => [
            styles.manualAddButton,
            {
              backgroundColor: colors.surfacePressed,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text variant="caption" color="brand" style={styles.manualAddText}>
            Manual
          </Text>
        </Pressable>
      </View>

      {/* Server / model availability banner */}
      {(serverUnreachable || modelUnavailable) && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.accentSoft,
              borderColor: colors.accent,
              marginHorizontal: layout.screenPadding,
            },
          ]}
        >
          <Ionicons name="cloud-offline-outline" size={18} color={colors.accent} />
          <Text variant="caption" color="primary" style={styles.errorBannerText}>
            {serverUnreachable
              ? "Fresco scanner is offline. Check your connection to scan produce."
              : "Scanner model isn't loaded right now. Use Manual add above."}
          </Text>
          {serverUnreachable && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry server check"
              onPress={() => void health.refetch()}
              style={styles.bannerActionHit}
            >
              <Text variant="caption" color="accent" style={styles.bannerActionText}>
                Retry
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Error Banner */}
      {error != null && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.dangerSoft,
              borderColor: colors.danger,
              marginHorizontal: layout.screenPadding,
            },
          ]}
        >
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text variant="caption" color="danger" style={styles.errorBannerText}>
            {error}
          </Text>
          {lastAsset != null && !busy && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry scan"
              onPress={retryScan}
              style={styles.bannerActionHit}
            >
              <Text variant="caption" color="danger" style={styles.bannerActionText}>
                Retry
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
            onPress={() => setError(null)}
            style={styles.bannerCloseHit}
          >
            <Ionicons name="close" size={18} color={colors.danger} />
          </Pressable>
        </View>
      )}

      {/* Tall Immersive Viewfinder Card */}
      <View
        style={[
          styles.viewfinderCard,
          {
            marginHorizontal: layout.screenPadding,
            borderRadius: radius.sheet,
            backgroundColor: colors.surfacePressed,
            borderColor: colors.border,
          },
          elevation.card,
        ]}
      >
        {reviewAsset != null ? (
          <View style={StyleSheet.absoluteFill}>
            <Image source={{ uri: reviewAsset.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {!busy && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retake photo"
                onPress={() => setReviewAsset(null)}
                style={styles.retakeButton}
              >
                <Ionicons name="refresh" size={16} color={colors.primaryText} />
                <Text variant="caption" color="inverse">
                  Retake
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          focused && (
            <CameraView
              key={`camera-feed-${cameraKey}`}
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              mode="picture"
              enableTorch={torch}
              onMountError={() => {
                setCameraKey((k) => k + 1);
              }}
            />
          )
        )}

        <View style={styles.framingOverlay} pointerEvents="none">
          <View style={[styles.bracket, styles.bracketTopLeft]} />
          <View style={[styles.bracket, styles.bracketTopRight]} />
          <View style={[styles.bracket, styles.bracketBottomLeft]} />
          <View style={[styles.bracket, styles.bracketBottomRight]} />
        </View>
      </View>

      {/* Bottom Controls Bar */}
      <View style={[styles.controlsBar, { paddingHorizontal: layout.screenPadding }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose from gallery"
          onPress={() => void handlePick()}
          disabled={busy}
          style={({ pressed }) => [
            styles.sideCircleButton,
            {
              backgroundColor: colors.surfacePressed,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="images-outline" size={24} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo of produce"
          accessibilityState={{ disabled: busy }}
          onPress={() => void handleCapture()}
          disabled={busy}
          style={({ pressed }) => [
            styles.shutterOuter,
            {
              borderColor: colors.primary,
              opacity: busy ? 0.6 : pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          <View style={[styles.shutterInner, { backgroundColor: colors.accent }]} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={torch ? "Turn off torch" : "Turn on torch"}
          onPress={() => {
            void hapticSelection();
            setTorch((v) => !v);
          }}
          disabled={busy}
          style={({ pressed }) => [
            styles.sideCircleButton,
            {
              backgroundColor: torch ? colors.accentSoft : colors.surfacePressed,
              borderColor: torch ? colors.accent : colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons
            name={torch ? "flashlight" : "flashlight-outline"}
            size={24}
            color={torch ? colors.accent : colors.textPrimary}
          />
        </Pressable>
      </View>

      <Text variant="micro" color="tertiary" align="center" style={styles.bottomHint}>
        Hold steady — center one produce item
      </Text>

      <ProcessingOverlay visible={busy} onCancel={handleCancelScan} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  manualAddButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    gap: 4,
  },
  manualAddText: {
    fontWeight: "700",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
  },
  bannerActionHit: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  bannerActionText: {
    fontWeight: "700",
  },
  bannerCloseHit: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinderCard: {
    flex: 1,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  retakeButton: {
    position: "absolute",
    top: 14,
    left: 14,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 36, 27, 0.72)",
    paddingHorizontal: 14,
    borderRadius: 22,
    gap: 6,
  },
  framingOverlay: {
    ...StyleSheet.absoluteFill,
    margin: 36,
  },
  bracket: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#FFFFFF",
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 10,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 10,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 10,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 10,
  },
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
  },
  sideCircleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  bottomHint: {
    marginBottom: 12,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  permissionTitle: {
    marginBottom: 8,
  },
  permissionBody: {
    maxWidth: 280,
    lineHeight: 20,
  },
});
