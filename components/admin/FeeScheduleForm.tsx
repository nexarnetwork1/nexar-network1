"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/hooks/useZodForm";
import {
  feeScheduleSchema,
  type FeeScheduleInput,
} from "@/modules/platform/validators";
import { updateFeeScheduleAction } from "@/modules/platform/actions";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import { getPaymentMethodLabel } from "@/lib/constants/payment-branding";
import type { ZodSchema } from "zod";

const FEE_METHODS = ["nxr", "crypto_other", "card"] as const;

export function FeeScheduleForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useZodForm<FeeScheduleInput>({
    schema: feeScheduleSchema as ZodSchema<FeeScheduleInput>,
    defaultValues: { paymentType: "nxr", baseRate: 0.035 },
  });

  const paymentType = watch("paymentType");

  async function onSubmit(data: FeeScheduleInput) {
    setServerError(null);
    setSuccess(false);

    const result = await updateFeeScheduleAction(data.paymentType, data.baseRate);

    if (!result.success) {
      setServerError(result.error ?? "Failed to add fee schedule");
      return;
    }

    setSuccess(true);
    reset({ paymentType: data.paymentType, baseRate: 0.035 });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-wrap items-end gap-3" noValidate>
      <div>
        <label className="text-xs text-zinc-400">Type</label>
        <div className="mt-1 flex items-center gap-2">
          <PaymentMethodLogo method={paymentType} size={20} />
          <select
            {...register("paymentType")}
            className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
          >
            {FEE_METHODS.map((method) => (
              <option key={method} value={method}>
                {getPaymentMethodLabel(method)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-400">Base rate (e.g. 0.035 = 3.5%)</label>
        <input
          {...register("baseRate", { valueAsNumber: true })}
          type="number"
          step="0.0001"
          min="0"
          max="1"
          className="mt-1 block rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
        />
        {errors.baseRate && (
          <p className="mt-1 text-xs text-red-400">{errors.baseRate.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Add schedule"}
      </button>
      {serverError && <p className="w-full text-sm text-red-400">{serverError}</p>}
      {success && <p className="w-full text-sm text-emerald-400">Fee schedule added</p>}
    </form>
  );
}
