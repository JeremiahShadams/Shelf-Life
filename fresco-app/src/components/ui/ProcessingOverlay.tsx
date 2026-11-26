/**
 * FRESCO — Scan Processing Overlay
 * Uses react-native-reanimated for native UI-thread pulsing motion.
 * Progressive timer-based feedback with a Cancel escape hatch after 3s
 * so users are never trapped on slow connections.
 */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export interface ProcessingOverlayProps {
  visible: boolean;
  onCancel?: () => void;
}

export function ProcessingOverlay({ visible, onCancel }: ProcessingOverlayProps) {
  const theme = useTheme();
  const { colors } = theme;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pulseScale = useSharedValue(0.88);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 1100 }),
          withTiming(0.88, { duration: 1100 }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 1100 }),
          withTiming(0.28, { duration: 1100 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = 0.88;
      pulseOpacity.value = 0.4;
    }
  }, [pulseOpacity, pulseScale, visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    if (!visible) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => {
      clearInterval(interval);
      setElapsedSeconds(0);
    };
  }, [visible]);

  if (!visible) return null;

  let title = "Analyzing your produce...";
  let subtitle = "Checking freshness and shelf life";
  let titleColor = colors.primaryText;

  if (elapsedSeconds >= 18) {
    title = "Taking longer than usual...";
    subtitle = "Slow connection — you can cancel and retry anytime";
    titleColor = colors.accent;
  } else if (elapsedSeconds >= 7) {
    title = "Almost done...";
    subtitle = "Matching variety and storage guidance";
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlayContainer, { backgroundColor: colors.scrim }]}>
        <View style={styles.contentCenter}>
          <View style={styles.spinnerContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                { borderColor: colors.accent },
                pulseStyle,
              ]}
            />
            <ActivityIndicator size="large" color={colors.primaryText} />
          </View>

          <View style={styles.textContainer}>
            <Text variant="cardTitle" align="center" style={{ color: titleColor, marginBottom: 6 }}>
              {title}
            </Text>
            <Text variant="caption" align="center" style={styles.subtitleText}>
              {subtitle}
            </Text>
          </View>

          {onCancel && elapsedSeconds >= 3 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel scan"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Text variant="bodyStrong" color="inverse">
                Cancel scan
              </Text>
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
  },
  textContainer: {
    alignItems: "center",
    minHeight: 54,
  },
  subtitleText: {
    color: "rgba(255, 255, 255, 0.78)",
  },
  cancelButton: {
    marginTop: 24,
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});
