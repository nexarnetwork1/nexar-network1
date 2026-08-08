"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/hooks/useZodForm";
import {
  platformSettingsSchema,
  type PlatformSettingsInput,
} from "@/modules/platform/validators";
import { updatePlatformSettingsAction } from "@/modules/platform/actions";
import { objectToFormData } from "@/utils/form-data";
import type { ZodSchema } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
      <Input
        label="Treasury wallet address"
        error={errors.treasuryWallet?.message}
        {...register("treasuryWallet")}
      />
      <Input
        label="Support email"
        error={errors.supportEmail?.message}
        {...register("supportEmail")}
      />
      <Input label="NXR token address" {...register("nxrToken")} />
      <Input label="USDT token address" {...register("usdtToken")} />

      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      {success && <p className="text-sm text-success">Settings saved</p>}

      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
