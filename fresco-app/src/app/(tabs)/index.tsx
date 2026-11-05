/**
 * Fresco — Scan (home tab)
 * Camera-first capture with a photo-library fallback. Every state is
 * handled: permission unknown, permission denied (ask again or open
 * Settings), camera mount failure, uploading, scan error, and content.
 *
 * The camera preview is unmounted whenever the tab loses focus — iOS and
 * Android only allow one active preview, and leaving it running drains
 * battery behind other screens.
 */

import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Button, ErrorState, Loading, Text } from "../../components/ui";
import { isModelNotDeployed, scanImage, type ScanAsset } from "../../services/scan";

function fileName(uri: string, fallback: string): string {
  const tail = uri.split("/").pop();
  return tail && tail.includes(".") ? tail : fallback;
}

export default function ScanScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius } = theme;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [focused, setFocused] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelMissing, setModelMissing] = useState(false);

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
      router.push({
        pathname: "/scan-result",
        params: { scan: JSON.stringify(result) },
      });
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
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) {
        setError("Couldn't capture that photo. Try again.");
        return;
      }
      await upload({
        uri: photo.uri,
        name: fileName(photo.uri, "scan.jpg"),
        mimeType: "image/jpeg",
      });
    } catch {
      setError("Couldn't capture that photo. Try again.");
    }
  }

  async function handlePick() {
    if (busy) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    await upload({
      uri: asset.uri,
      name: asset.fileName ?? fileName(asset.uri, "scan.jpg"),
      mimeType: asset.mimeType,
    });
  }

  // Permission still resolving.
  if (permission == null) {
    return <Loading fullScreen style={{ backgroundColor: colors.background }} />;
  }

  // Permission denied — explain and offer the two legal paths.
  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.permission, { paddingHorizontal: layout.screenPadding }]}>
          <Text variant="largeTitle">Scan</Text>
          <Text variant="body" color="secondary" style={{ marginTop: spacing.s }}>
            Fresco uses the camera to identify produce and check how fresh it is.
          </Text>

          <Button
            label={permission.canAskAgain ? "Allow camera" : "Open settings"}
            block
            onPress={() => {
              if (permission.canAskAgain) void requestPermission();
              else void Linking.openSettings();
            }}
            style={{ marginTop: spacing.l }}
          />
          <Button
            label="Choose a photo instead"
            variant="ghost"
            block
            onPress={() => void handlePick()}
            style={{ marginTop: spacing.s }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Model not deployed — keep the app useful by pointing at the manual path.
  if (modelMissing) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          full
          title="Scanning isn't live yet"
          message="The AI model hasn't been deployed on the server. You can still add items by name and track their shelf life."
          retryLabel="Add item by name"
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
      </View>
    );
  }

  // Scan error.
  if (error != null) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          full
          message={error}
          onRetry={() => setError(null)}
        />
        <View style={{ paddingHorizontal: layout.screenPadding, paddingBottom: spacing.l }}>
          <Button
            label="Choose a photo instead"
            variant="ghost"
            block
            onPress={() => void handlePick()}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: layout.screenPadding, paddingTop: spacing.m }}>
        <Text variant="largeTitle">Scan</Text>
        <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
          Point at one piece of produce.
        </Text>
      </View>

      <View
        style={[
          styles.cameraFrame,
          {
            marginHorizontal: layout.screenPadding,
            marginTop: spacing.m,
            borderRadius: radius.sheet,
            backgroundColor: colors.surfacePressed,
          },
        ]}
      >
        {focused && (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            onCameraReady={() => setCameraReady(true)}
            onMountError={() => setError("The camera couldn't start on this device.")}
          />
        )}

        {busy && (
          <View style={[StyleSheet.absoluteFill, styles.busyOverlay, { backgroundColor: colors.scrim }]}>
            <ActivityIndicator color={colors.onAccent} />
            <Text variant="caption" style={{ color: colors.onAccent, marginTop: spacing.s }}>
              Reading your produce…
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.controls, { paddingHorizontal: layout.screenPadding }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose a photo"
          onPress={() => void handlePick()}
          disabled={busy}
          style={styles.sideButton}
        >
          <Ionicons name="images-outline" size={24} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take a photo"
          accessibilityState={{ disabled: !cameraReady || busy }}
          onPress={() => void handleCapture()}
          disabled={!cameraReady || busy}
          style={[
            styles.shutter,
            {
              borderColor: colors.primary,
              opacity: !cameraReady || busy ? 0.4 : 1,
            },
          ]}
        >
          <View style={[styles.shutterInner, { backgroundColor: colors.primary }]} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={torch ? "Turn off flashlight" : "Turn on flashlight"}
          onPress={() => setTorch((v) => !v)}
          disabled={busy}
          style={styles.sideButton}
        >
          <Ionicons
            name={torch ? "flashlight" : "flashlight-outline"}
            size={24}
            color={torch ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>

      <Text
        variant="micro"
        color="tertiary"
        align="center"
        style={{ marginBottom: spacing.m }}
      >
        Hold steady · one item at a time
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  permission: { flex: 1, justifyContent: "center" },
  cameraFrame: { flex: 1, overflow: "hidden" },
  busyOverlay: { alignItems: "center", justifyContent: "center" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  sideButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28 },
});
