"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useZodForm } from "@/hooks/useZodForm";
import { customerRegisterSchema, type CustomerRegisterInput } from "@/schemas";
import { registerCustomerAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<CustomerRegisterInput>({
    schema: customerRegisterSchema,
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      walletAddress: "",
    },
  });

  async function onSubmit(data: CustomerRegisterInput) {
    setServerError(null);

    const result = await registerCustomerAction(objectToFormData(data));

    if (!result.success) {
      setServerError(result.error ?? "Registration failed");
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
    >
      <OAuthButtons intent="customer" />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted uppercase tracking-wider">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <Input
          {...register("fullName")}
          label="Full name"
          placeholder="John Doe"
          error={errors.fullName?.message}
        />
        <Input
          {...register("email")}
          type="email"
          label="Email"
          placeholder="you@example.com"
          error={errors.email?.message}
        />
        <Input
          {...register("password")}
          type="password"
          label="Password"
          placeholder="Min. 8 characters"
          error={errors.password?.message}
        />
        <Input
          {...register("walletAddress")}
          label="Wallet address (BSC)"
          placeholder="0x..."
          spellCheck={false}
          error={errors.walletAddress?.message}
        />

        {serverError && <p className="text-sm text-red-400">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create customer account"}
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
