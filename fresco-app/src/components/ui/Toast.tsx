/**
 * FRESCO — Floating Action Toast
 * Uses react-native-reanimated layout animations (FadeInDown / FadeOutDown)
 * for native UI-thread motion compatible with React Compiler, paired with a
 * high-contrast organic charcoal surface (#1A241B) and mint check icon (#6EE7B7).
 */

import React, { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export interface ToastProps {
  visible: boolean;
  message: string;
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number;
  bottomOffset?: number;
}

export function Toast({
  visible,
  message,
  onUndo,
  onDismiss,
  duration = 4000,
  bottomOffset = 96,
}: ToastProps) {
  const theme = useTheme();
  const { colors, radius, elevation } = theme;

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (!visible || duration <= 0) return;
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, handleDismiss, visible]);

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
      handleDismiss();
    }
  };

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.overlayContainer, { bottom: bottomOffset }]}>
      <Animated.View
        entering={FadeInDown.duration(220)}
        exiting={FadeOutDown.duration(160)}
        style={[
          styles.toastCard,
          {
            backgroundColor: colors.toastBg,
            borderRadius: radius.card,
            ...elevation.modal,
          },
        ]}
      >
        <View style={styles.contentLeft}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.toastIcon}
            style={styles.icon}
          />
          <Text
            variant="caption"
            color="inverse"
            style={styles.messageText}
            numberOfLines={1}
          >
            {message}
          </Text>
        </View>

        {onUndo && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Undo action"
            onPress={handleUndo}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={({ pressed }) => [
              styles.undoButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text variant="bodyStrong" color="inverse" style={styles.undoText}>
              Undo
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 360,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  contentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  icon: {
    marginRight: 10,
  },
  messageText: {
    flexShrink: 1,
  },
  undoButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  undoText: {
    textDecorationLine: "underline",
  },
});
