"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
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
        <p className="text-sm text-text-muted mt-1">Create your account.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="john_doe"
          required
        />
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
          placeholder="Min 6 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          required
        />

        <Button type="submit" fullWidth loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-sm text-text-muted text-center mt-6">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-accent font-medium underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
