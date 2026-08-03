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
import { Button } from "@/components/ui/Button";
import { dashboardFilterControlClass } from "@/components/dashboard/DashboardFilters";
import { cn } from "@/lib/utils/cn";

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      noValidate
    >
      <div className="min-w-0">
        <label htmlFor="fee-payment-type" className="text-xs text-muted">
          Type
        </label>
        <div className="mt-1 flex items-center gap-2">
          <PaymentMethodLogo method={paymentType} size={20} />
          <select
            {...register("paymentType")}
            id="fee-payment-type"
            className={dashboardFilterControlClass}
          >
            {FEE_METHODS.map((method) => (
              <option key={method} value={method}>
                {getPaymentMethodLabel(method)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="min-w-0">
        <label htmlFor="fee-base-rate" className="text-xs text-muted">
          Base rate (e.g. 0.035 = 3.5%)
        </label>
        <input
          {...register("baseRate", { valueAsNumber: true })}
          id="fee-base-rate"
          type="number"
          step="0.0001"
          min="0"
          max="1"
          className={cn("mt-1 block w-full sm:w-48", dashboardFilterControlClass)}
        />
        {errors.baseRate && (
          <p className="mt-1 text-xs text-red-400">{errors.baseRate.message}</p>
        )}
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Add schedule"}
      </Button>
      {serverError && <p className="w-full text-sm text-red-400">{serverError}</p>}
      {success && <p className="w-full text-sm text-emerald-400">Fee schedule added</p>}
    </form>
  );
}
