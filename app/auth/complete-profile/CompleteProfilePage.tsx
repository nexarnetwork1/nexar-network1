"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { completeProfileAction } from "@/modules/auth/actions";

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  const [role, setRole] = useState<"customer" | "merchant">(
    intent === "merchant" ? "merchant" : "customer"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    const result = await completeProfileAction(formData);

    if (!result.success) {
      setError(result.error ?? "Failed to complete profile");
      setLoading(false);
      return;
    }

    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <AuthCard
      title="Complete your profile"
      subtitle="One-time setup for your Nexar Network account"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="fullName" label="Full name" placeholder="John Doe" required />

        <Select
          name="roleDisplay"
          label="Account type"
          value={role}
          onChange={(e) => setRole(e.target.value as "customer" | "merchant")}
          options={[
            { value: "customer", label: "Customer" },
            { value: "merchant", label: "Merchant" },
          ]}
        />

        {role === "merchant" && (
          <>
            <Input name="storeName" label="Store name" placeholder="My Store" required />
            <Input name="businessType" label="Business type" placeholder="Retail, Services, etc." required />
            <Select
              name="mode"
              label="Store mode"
              required
              options={[
                { value: "marketplace", label: "Marketplace" },
                { value: "payments_only", label: "Payments only" },
              ]}
            />
          </>
        )}

        <Input
          name="walletAddress"
          label="Wallet address (BSC)"
          placeholder="0x..."
          required
          spellCheck={false}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Complete profile"}
        </Button>
      </form>
    </AuthCard>
  );
}
