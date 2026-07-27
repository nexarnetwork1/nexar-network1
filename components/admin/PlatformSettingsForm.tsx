"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/hooks/useZodForm";
import {
  platformSettingsSchema,
  type PlatformSettingsInput,
} from "@/modules/platform/validators";
import { updatePlatformSettingsAction } from "@/modules/platform/actions";
import { objectToFormData } from "@/utils/form-data";
import type { ZodSchema } from "zod";

type PlatformSettingsFormProps = {
  defaultValues: PlatformSettingsInput;
};

export function PlatformSettingsForm({ defaultValues }: PlatformSettingsFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<PlatformSettingsInput>({
    schema: platformSettingsSchema as ZodSchema<PlatformSettingsInput>,
    defaultValues,
  });

  async function onSubmit(data: PlatformSettingsInput) {
    setServerError(null);
    setSuccess(false);

    const result = await updatePlatformSettingsAction(objectToFormData(data));

    if (!result.success) {
      setServerError(result.error ?? "Failed to save settings");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4" noValidate>
      <AdminField
        label="Treasury wallet address"
        error={errors.treasuryWallet?.message}
        {...register("treasuryWallet")}
      />
      <AdminField
        label="Support email"
        error={errors.supportEmail?.message}
        {...register("supportEmail")}
      />
      <AdminField label="NXR token address" {...register("nxrToken")} />
      <AdminField label="USDT token address" {...register("usdtToken")} />

      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      {success && <p className="text-sm text-emerald-400">Settings saved</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

type AdminFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

function AdminField({ label, error, ...props }: AdminFieldProps) {
  return (
    <div>
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
