"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerCustomerAction } from "@/modules/auth/actions";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await registerCustomerAction(new FormData(e.currentTarget));

    if (!result.success) {
      setError(result.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    if (result.needsEmailConfirmation) {
      router.push("/login?message=confirm_email");
      return;
    }

    router.push(result.redirectTo ?? "/customer");
    router.refresh();
  }

  return (
    <AuthCard
      title="Customer registration"
      subtitle="Browse, buy, and pay with crypto or card"
      className="max-w-lg"
    >
      <OAuthButtons intent="customer" />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted uppercase tracking-wider">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="fullName" label="Full name" placeholder="John Doe" required />
        <Input name="email" type="email" label="Email" placeholder="you@example.com" required />
        <Input name="password" type="password" label="Password" placeholder="Min. 8 characters" required minLength={8} />
        <Input
          name="walletAddress"
          label="Wallet address (BSC)"
          placeholder="0x..."
          required
          spellCheck={false}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create customer account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/register" className="text-gold hover:text-gold-secondary">
          ← Back
        </Link>
      </p>
    </AuthCard>
  );
}
