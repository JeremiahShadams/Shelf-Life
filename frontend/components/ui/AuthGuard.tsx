"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Client-side auth guard — replaces deprecated Next.js 16 middleware.
 * Wrap any protected page content with this component.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/signin?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="block h-8 w-8 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // Don't render children until authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="block h-8 w-8 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
