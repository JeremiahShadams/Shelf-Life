/**
 * Fresco — Root layout
 * Loads Fraunces display typography, holds expo-splash-screen until both fonts
 * and persisted auth state resolve, and renders a branded cold-start view
 * instead of an unbranded spinner void.
 */

import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Fraunces_700Bold,
  Fraunces_800ExtraBold,
  Fraunces_900Black,
  useFonts,
} from "@expo-google-fonts/fraunces";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Text } from "../components/ui";
import { useAuth } from "../stores/auth";
import { useTheme } from "../../theme";
import type { AuthStatus } from "../stores/auth";

void SplashScreen.preventAutoHideAsync();

function useProtectedRoute(status: AuthStatus, ready: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready || status === "idle") return;

    const inAuthGroup = segments[0] === "(auth)";
    if (status === "anon" && !inAuthGroup) {
      router.replace("/(auth)/landing");
    } else if (status === "authed" && inAuthGroup) {
      router.replace("/");
    }
  }, [ready, status, segments, router]);
}

function BrandedBootScreen() {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.bootContainer, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.emblem,
          {
            backgroundColor: colors.secondaryAction,
            borderRadius: radius.full,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="leaf" size={32} color={colors.primary} />
      </View>
      <Text variant="wordmark" color="brand" style={styles.bootWordmark}>
        fresco
      </Text>
      <Text variant="caption" color="secondary">
        Honest produce shelf life
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const hydrate = useAuth((s) => s.hydrate);
  const status = useAuth((s) => s.status);
  const theme = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    Fraunces_700Bold,
    Fraunces_800ExtraBold,
    Fraunces_900Black,
  });

  const fontsReady = fontsLoaded || Boolean(fontError);
  const appReady = fontsReady && status !== "idle";

  useProtectedRoute(status, appReady);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (appReady) {
      void SplashScreen.hideAsync();
    }
  }, [appReady]);

  useEffect(() => {
    if (status === "anon") queryClient.clear();
  }, [status, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {!appReady ? (
        <BrandedBootScreen />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="scan-result" options={{ presentation: "modal" }} />
          <Stack.Screen name="add-item" options={{ presentation: "modal" }} />
          <Stack.Screen name="inventory/[id]" />
          <Stack.Screen name="notifications" />
        </Stack>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emblem: {
    width: 72,
    height: 72,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  bootWordmark: {
    marginBottom: 4,
  },
});
