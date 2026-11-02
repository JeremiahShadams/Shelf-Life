"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/auth/signin");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] px-4">
        <p className="text-text-muted mb-4">You&apos;re not signed in.</p>
        <Button onClick={() => router.push("/auth/signin")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 pt-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Account</h1>


      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.username}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Settings */}
      <div className="mt-6 flex flex-col gap-3">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            <span className="text-xs text-text-muted">Coming soon</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Storage Preferences</span>
            <span className="text-xs text-text-muted">Coming soon</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">About Fresco</span>
            <span className="text-xs text-text-muted">v1.0.0</span>
          </div>
        </Card>
      </div>

      {/* Logouttt */}
      <div className="mt-8">
        <Button
          variant="secondary"
          fullWidth
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
