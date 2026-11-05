/**
 * Fresco — Root layout
 * QueryClient for all server state, Stack over the tab shell, and a silent
 * auth `hydrate()` on boot so a cold start restores the session without
 * flashing a login screen. Native headers stay off app-wide — screens draw
 * their own titles in content.
 */

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { Loading } from "../components/ui";
import { useAuth } from "../stores/auth";
import { useTheme } from "../../theme";
import type { AuthStatus } from "../stores/auth";

/**
 * Route guard, called from the root layout (the documented Expo Router
 * pattern). Runs only after `hydrate()` settles — "idle" means we don't know
 * yet, and redirecting then would bounce a signed-in user to login.
 */
function useProtectedRoute(status: AuthStatus) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "idle") return;

    const inAuthGroup = segments[0] === "(auth)";
    if (status === "anon" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (status === "authed" && inAuthGroup) {
      router.replace("/");
    }
  }, [status, segments, router]);
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const hydrate = useAuth((s) => s.hydrate);
  const status = useAuth((s) => s.status);
  const theme = useTheme();

  useProtectedRoute(status);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      {status === "idle" ? (
        // Unknown session → hold the splash instead of rendering a route
        // that will immediately redirect.
        <Loading fullScreen style={{ backgroundColor: theme.colors.background }} />
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
