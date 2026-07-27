"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginAction } from "@/modules/auth/actions";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? undefined;
  const message = searchParams.get("message");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (redirect) formData.set("redirect", redirect);

    const result = await loginAction(formData);

    if (!result.success) {
      setError(result.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <AuthCard title="Sign in" subtitle="Access your Nexar Network account">
      {message === "confirm_email" && (
        <p className="mb-6 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-gold-secondary">
          Check your email to confirm your account, then sign in.
        </p>
      )}

      <OAuthButtons redirectTo={redirect} />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted uppercase tracking-wider">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-gold hover:text-gold-secondary">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}
