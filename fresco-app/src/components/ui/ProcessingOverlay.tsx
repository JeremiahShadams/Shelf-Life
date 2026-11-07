/**
 * FRESCO — Uber Base Processing Overlay
 * Matches SuperDesign draft (2010a8d9-ff1e-477d-abe3-bf57f876c94a):
 * - Full-screen dark translucent backdrop overlay (rgba(0,0,0,0.85))
 * - Pulsing ambient outer glow ring around the activity spinner
 * - Progressive timer-based feedback:
 *     Phase 1 (0–8s): "Analyzing your fruit..." / "This takes a few seconds"
 *     Phase 2 (8–20s): "Almost done..." / "Comparing with our database"
 *     Phase 3 (20s+): Amber text "Taking longer than expected..." / "Still trying to connect"
 * - Optional cancel button if user wishes to abort
 */

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export interface ProcessingOverlayProps {
  visible: boolean;
  onCancel?: () => void;
}

export function ProcessingOverlay({ visible, onCancel }: ProcessingOverlayProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0.85)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  // Pulse animation loop
  useEffect(() => {
    if (!visible) return;

    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.85,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.25,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [visible]);

  // Elapsed timer tracking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (visible) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible]);

  if (!visible) return null;

  // Progressive message phases per design
  let title = "Analyzing your fruit...";
  let subtitle = "This takes a few seconds";
  let titleColor = "#FFFFFF";
  let subtitleColor = "rgba(255, 255, 255, 0.65)";

  if (elapsedSeconds >= 20) {
    title = "Taking longer than expected...";
    subtitle = "Still trying to connect to AI server";
    titleColor = colors.statusWarning;
    subtitleColor = "rgba(230, 149, 0, 0.85)";
  } else if (elapsedSeconds >= 8) {
    title = "Almost done...";
    subtitle = "Comparing with our produce database";
    titleColor = "#FFFFFF";
    subtitleColor = "rgba(255, 255, 255, 0.65)";
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayContainer}>
        <View style={styles.contentCenter}>
          {/* Spinner with Pulsing Ambient Ring */}
          <View style={styles.spinnerContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>

          {/* Dynamic Progressive Text */}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.titleText,
                { color: titleColor },
              ]}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.subtitleText,
                { color: subtitleColor },
              ]}
            >
              {subtitle}
            </Text>
          </View>

          {/* Cancel button after 10s */}
          {elapsedSeconds >= 10 && onCancel && (
            <Pressable
              onPress={onCancel}
              style={styles.cancelButton}
              hitSlop={12}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: "rgba(13, 23, 17, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  contentCenter: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  spinnerContainer: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: "#22C55E",
  },
  textContainer: {
    alignItems: "center",
    minHeight: 54,
  },
  titleText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 28,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

