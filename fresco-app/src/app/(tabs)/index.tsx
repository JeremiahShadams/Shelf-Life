/**
 * FRESCO — Scan (Home Screen)
 * High-performance, full-viewport produce scanner.
 * - Tall, immersive camera viewfinder with rounded corners and framing brackets
 * - Clean tactile bottom controls: Gallery Photo Picker | 78px Shutter | Flashlight
 * - Real-time progressive 3-stage ProcessingOverlay with organic green pulsing ring
 * - Direct photo upload with automatic Blob conversion for WinterCG fetch
 */

import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
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

  // Review asset if photo captured
  const [reviewAsset, setReviewAsset] = useState<ScanAsset | null>(null);

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
      setReviewAsset(null);
      router.push({
        pathname: "/scan-result",
        params: { scan: JSON.stringify(result) },
      });
    } catch (err) {
      if (isModelNotDeployed(err)) {
        setModelMissing(true);
      } else {
        const msg = err instanceof Error ? err.message : "Couldn't scan produce. Check server connection.";
        setError(msg);
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
        setError("Couldn't capture photo. Please try again.");
        return;
      }
      const asset: ScanAsset = {
        uri: photo.uri,
        name: fileName(photo.uri, "scan.jpg"),
        mimeType: "image/jpeg",
      };
      setReviewAsset(asset);
      void upload(asset);
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
      if (result.canceled || !result.assets[0]) return;

      const picked = result.assets[0];
      const asset: ScanAsset = {
        uri: picked.uri,
        name: picked.fileName ?? fileName(picked.uri, "scan.jpg"),
        mimeType: picked.mimeType ?? "image/jpeg",
      };
      setReviewAsset(asset);
      void upload(asset);
    } catch {
      setError("Couldn't open photo library.");
    }
  }

  // Permission still loading
  if (permission == null) {
    return <Loading fullScreen style={{ backgroundColor: colors.background }} />;
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.permissionContainer, { paddingHorizontal: layout.screenPadding }]}>
          <View style={[styles.permissionIconCircle, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="camera" size={40} color={colors.primary} />
          </View>
          <Text variant="largeTitle" align="center" style={styles.permissionTitle}>
            Camera Access
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.permissionBody}>
            Fresco uses your camera to identify fruit varieties and estimate truthful shelf life.
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

  // Model not deployed state
  if (modelMissing) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          full
          title="AI Scanner Offline"
          message="The fruit classifier model artifact is currently being loaded. You can still add items manually and track expiration."
          retryLabel="Add Item Manually"
          onRetry={() => router.push("/add-item")}
        />
        <View style={{ paddingHorizontal: layout.screenPadding, paddingBottom: spacing.l }}>
          <Button
            label="Try Another Photo"
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
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {/* Top Header */}
      <View style={[styles.header, { paddingHorizontal: layout.screenPadding }]}>
        <View>
          <Text variant="largeTitle" style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Scan
          </Text>
          <Text variant="caption" style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Point at one piece of produce.
          </Text>
        </View>

        {/* Quick Add Fruit Manual Shortcut */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add fruit by name"
          onPress={() => router.push("/add-item")}
          hitSlop={8}
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
          <Text variant="micro" style={[styles.manualAddText, { color: colors.primary }]}>
            Manual
          </Text>
        </Pressable>
      </View>

      {/* Error Banner if error occurred */}
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
          <Text variant="caption" style={[styles.errorBannerText, { color: colors.danger }]}>
            {error}
          </Text>
          <Pressable onPress={() => setError(null)} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.danger} />
          </Pressable>
        </View>
      )}

      {/* Tall Immersive Viewfinder Card */}
      <View
        style={[
          styles.viewfinderCard,
          {
            marginHorizontal: layout.screenPadding,
            borderRadius: radius.sheet ?? 28,
            backgroundColor: colors.surfacePressed,
            borderColor: colors.border,
          },
          elevation.card,
        ]}
      >
        {/* Camera Live Preview or Captured Snapshot Review */}
        {reviewAsset != null ? (
          <Image
            source={{ uri: reviewAsset.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          focused && (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => setError("The camera couldn't start on this device.")}
            />
          )
        )}

        {/* Framing Guide Brackets (Apple / Lens style) */}
        <View style={styles.framingOverlay} pointerEvents="none">
          <View style={[styles.bracket, styles.bracketTopLeft]} />
          <View style={[styles.bracket, styles.bracketTopRight]} />
          <View style={[styles.bracket, styles.bracketBottomLeft]} />
          <View style={[styles.bracket, styles.bracketBottomRight]} />
        </View>
      </View>

      {/* Bottom Controls Bar (Placed below viewfinder) */}
      <View style={[styles.controlsBar, { paddingHorizontal: layout.screenPadding }]}>
        {/* Gallery / Library Picker */}
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

        {/* Large 78px Primary Shutter Button - Deep Forest ring with Carrot Orange capture core */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo of produce"
          accessibilityState={{ disabled: !cameraReady || busy }}
          onPress={() => void handleCapture()}
          disabled={!cameraReady || busy}
          style={({ pressed }) => [
            styles.shutterOuter,
            {
              borderColor: colors.primary,
              opacity: !cameraReady || busy ? 0.5 : pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          <View
            style={[
              styles.shutterInner,
              { backgroundColor: colors.accent },
            ]}
          />
        </Pressable>

        {/* Flashlight Torch Toggle */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={torch ? "Turn off torch" : "Turn on torch"}
          onPress={() => setTorch((v) => !v)}
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

      {/* Bottom Guidance Tagline */}
      <Text
        variant="micro"
        align="center"
        style={[styles.bottomHint, { color: colors.textTertiary }]}
      >
        Hold steady · one item at a time
      </Text>

      {/* Progressive 3-Stage AI Processing Overlay */}
      <ProcessingOverlay visible={busy} />
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
  headerTitle: {
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
  },
  manualAddButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontWeight: "500",
  },
  viewfinderCard: {
    flex: 1,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
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
    fontSize: 12,
    fontWeight: "500",
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
