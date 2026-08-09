"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtlasLogo } from "@/components/ui/AtlasLogo";
import { useZodForm } from "@/hooks/useZodForm";
import { completeProfileSchema, type CompleteProfileInput } from "@/schemas";
import { completeProfileAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";
import { AtlasIdentityField } from "@/components/atlas/identity/AtlasIdentityFields";
import { AtlasWalletConnectPanel } from "@/components/atlas/auth/AtlasWalletConnectPanel";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useZodForm<CompleteProfileInput>({
    schema: completeProfileSchema,
    defaultValues: {
      fullName: "",
      username: "",
      walletAddress: "",
    },
  });

  async function onSubmit(data: CompleteProfileInput) {
    setServerError(null);
    const result = await completeProfileAction(objectToFormData(data));
    if (!result.success) {
      setServerError(result.error ?? "Failed to complete profile");
      return;
    }
    router.push(result.redirectTo ?? "/atlas");
    router.refresh();
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[var(--nxr-radius-xl)] border border-border bg-card/95 p-6 shadow-[var(--nxr-shadow-modal)]">
        <header className="mb-5 text-center">
          <div className="mb-3 flex justify-center">
            <AtlasLogo height={40} priority />
          </div>
          <p className="text-[10px] font-semibold tracking-[0.28em] text-gold uppercase">ATLAS</p>
          <h1 className="mt-2 font-heading text-xl font-semibold">Complete your profile</h1>
          <p className="mt-1 text-xs text-muted">One ATLAS identity — seller and business roles come later.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          <AtlasIdentityField
            id="complete-full-name"
            label="Full name"
            placeholder="John Doe"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <AtlasIdentityField
            id="complete-username"
            label="Username (optional)"
            placeholder="johndoe"
            error={errors.username?.message}
            {...register("username")}
          />
          <AtlasWalletConnectPanel
            requireAuth
            onAddress={(address) => setValue("walletAddress", address, { shouldValidate: true })}
          />
          <AtlasIdentityField
            id="complete-wallet"
            label="Wallet (optional)"
            placeholder="0x…"
            error={errors.walletAddress?.message}
            {...register("walletAddress")}
          />
          {serverError ? <p className="text-sm text-red-400">{serverError}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-gold/35 bg-gold px-4 py-3 text-sm font-semibold text-on-gold disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Continue to ATLAS"}
          </button>
        </form>
      </div>
    </div>
  );
}
