/**
 * Fresco — Root layout
 * QueryClient for all server state, Stack over the tab shell, and a silent
 * auth `hydrate()` on boot so a cold start restores the session without
 * flashing a login screen. Native headers stay off app-wide — screens draw
 * their own titles in content.
 */

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useAuth } from "../stores/auth";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan-result" options={{ presentation: "modal" }} />
      </Stack>
    </QueryClientProvider>
  );
}
