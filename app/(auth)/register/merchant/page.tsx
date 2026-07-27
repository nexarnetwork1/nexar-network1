"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useZodForm } from "@/hooks/useZodForm";
import { merchantRegisterSchema, type MerchantRegisterInput } from "@/schemas";
import { registerMerchantAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";

export default function MerchantRegisterPage() {
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<MerchantRegisterInput>({
    schema: merchantRegisterSchema,
    defaultValues: {
      merchantName: "",
      storeName: "",
      businessType: "",
      email: "",
      password: "",
      walletAddress: "",
      mode: "marketplace",
    },
  });

  async function onSubmit(data: MerchantRegisterInput) {
    setServerError(null);

    const formData = objectToFormData(data);
    const logoFile = logoRef.current?.files?.[0];
    if (logoFile) formData.set("logo", logoFile);

    const result = await registerMerchantAction(formData);

    if (!result.success) {
      setServerError(result.error ?? "Registration failed");
      return;
    }

    if (result.needsEmailConfirmation) {
      router.push("/login?message=confirm_email");
      return;
    }

    router.push(result.redirectTo ?? "/merchant");
    router.refresh();
  }

  async function onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSubmit(onSubmit)(event);
  }

  return (
    <AuthCard
      title="Merchant registration"
      subtitle="Accept payments and sell products on Nexar Network"
    >
      <OAuthButtons intent="merchant" />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted uppercase tracking-wider">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onFormSubmit} className="space-y-3" noValidate>
        <Input
          {...register("merchantName")}
          label="Merchant name"
          placeholder="Your business name"
          error={errors.merchantName?.message}
        />
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
        <Input
          {...register("email")}
          type="email"
          label="Email"
          placeholder="merchant@example.com"
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
        <Select
          {...register("mode")}
          label="Store mode"
          error={errors.mode?.message}
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
            ref={logoRef}
            id="logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-sm file:text-gold"
          />
        </div>

        {serverError && <p className="text-sm text-red-400">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create merchant account"}
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
