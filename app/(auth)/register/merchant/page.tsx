"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { registerMerchantAction } from "@/modules/auth/actions";

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await registerMerchantAction(new FormData(e.currentTarget));

    if (!result.success) {
      setError(result.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    if (result.needsEmailConfirmation) {
      router.push("/login?message=confirm_email");
      return;
    }

    router.push(result.redirectTo ?? "/merchant");
    router.refresh();
  }

  return (
    <AuthCard
      title="Merchant registration"
      subtitle="Accept payments and sell products on Nexar Network"
      className="max-w-lg"
    >
      <OAuthButtons intent="merchant" />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted uppercase tracking-wider">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="merchantName" label="Merchant name" placeholder="Your business name" required />
        <Input name="storeName" label="Store name" placeholder="My Store" required />
        <Input name="businessType" label="Business type" placeholder="Retail, Services, etc." required />
        <Input name="email" type="email" label="Email" placeholder="merchant@example.com" required />
        <Input name="password" type="password" label="Password" placeholder="Min. 8 characters" required minLength={8} />
        <Input
          name="walletAddress"
          label="Wallet address (BSC)"
          placeholder="0x..."
          required
          spellCheck={false}
        />
        <Select
          name="mode"
          label="Store mode"
          required
          options={[
            { value: "marketplace", label: "Marketplace — list products publicly" },
            { value: "payments_only", label: "Payments only — QR / invoice payments" },
          ]}
        />
        <div className="space-y-2">
          <label htmlFor="logo" className="block text-sm font-medium text-muted">
            Logo (optional)
          </label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-sm file:text-gold"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create merchant account"}
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
