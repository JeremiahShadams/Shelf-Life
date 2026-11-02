"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/scan");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center px-6 min-h-screen">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">fresco</h1>
        <p className="text-sm text-text-muted mt-1">Know your fruit.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button type="submit" fullWidth loading={loading}>
          Sign In
        </Button>
      </form>

      <p className="text-sm text-text-muted text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-accent font-medium underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
