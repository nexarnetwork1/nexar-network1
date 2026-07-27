"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useZodForm } from "@/hooks/useZodForm";
import { completeProfileSchema, type CompleteProfileInput } from "@/schemas";
import { completeProfileAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useZodForm<CompleteProfileInput>({
    schema: completeProfileSchema,
    defaultValues: {
      fullName: "",
      walletAddress: "",
      role: intent === "merchant" ? "merchant" : "customer",
      storeName: "",
      businessType: "",
      mode: "marketplace",
    },
  });

  const role = watch("role");

  async function onSubmit(data: CompleteProfileInput) {
    setServerError(null);

    const result = await completeProfileAction(objectToFormData(data));

    if (!result.success) {
      setServerError(result.error ?? "Failed to complete profile");
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          {...register("fullName")}
          label="Full name"
          placeholder="John Doe"
          error={errors.fullName?.message}
        />

        <Select
          {...register("role")}
          label="Account type"
          error={errors.role?.message}
          options={[
            { value: "customer", label: "Customer" },
            { value: "merchant", label: "Merchant" },
          ]}
        />

        {role === "merchant" && (
          <>
            <Input
              {...register("storeName")}
              label="Store name"
              placeholder="My Store"
              error={errors.storeName?.message}
            />
            <Input
              {...register("businessType")}
              label="Business type"
              placeholder="Retail, Services, etc."
              error={errors.businessType?.message}
            />
            <Select
              {...register("mode")}
              label="Store mode"
              error={errors.mode?.message}
              options={[
                { value: "marketplace", label: "Marketplace" },
                { value: "payments_only", label: "Payments only" },
              ]}
            />
          </>
        )}

        <Input
          {...register("walletAddress")}
          label="Wallet address (BSC)"
          placeholder="0x..."
          spellCheck={false}
          error={errors.walletAddress?.message}
        />

        {errors.root && (
          <p className="text-sm text-red-400">{errors.root.message}</p>
        )}
        {serverError && <p className="text-sm text-red-400">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Complete profile"}
        </Button>
      </form>
    </AuthCard>
  );
}
