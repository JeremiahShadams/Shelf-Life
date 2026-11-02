"use client";

import { AuthProvider } from "@/lib/auth-context";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OfflineBanner />
      {children}
    </AuthProvider>
  );
}
