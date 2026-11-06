/**
 * FRESCO — Uber Base Floating Toast
 * Floating black pill positioned above bottom navigation or screen bottom.
 * Matches design: Checkmark icon (green #05A357), bold white message, optional "Undo" action.
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        timer = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 16,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 16,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
      handleDismiss();
    }
  };

  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlayContainer,
        { bottom: bottomOffset },
      ]}
    >
      <Animated.View
        style={[
          styles.toastCard,
          {
            backgroundColor: colors.primary, // #000000 Uber Black
            borderRadius: radius.card,
            ...elevation.modal,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.contentLeft}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.statusSuccess}
            style={styles.icon}
          />
          <Text
            variant="body"
            style={[styles.messageText, { color: colors.primaryText }]}
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
            <Text
              variant="caption"
              style={[styles.undoText, { color: colors.primaryText }]}
            >
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
    fontWeight: "700",
    fontSize: 14,
    flexShrink: 1,
  },
  undoButton: {
    paddingVertical: 2,
  },
  undoText: {
    fontWeight: "700",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

