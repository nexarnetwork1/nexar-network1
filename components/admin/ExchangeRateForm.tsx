"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/hooks/useZodForm";
import {
  exchangeRateSchema,
  type ExchangeRateInput,
} from "@/modules/platform/validators";
import { updateExchangeRateAction } from "@/modules/platform/actions";
import { objectToFormData } from "@/utils/form-data";
import type { ZodSchema } from "zod";
import { CurrencySelectField } from "@/components/payments/CurrencySelectField";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import { Button } from "@/components/ui/Button";
import { dashboardFilterControlClass } from "@/components/dashboard/DashboardFilters";
import { cn } from "@/lib/utils/cn";

type ExchangeRateFormProps = {
  currencies?: Array<{ code: string; kind: string }>;
};

export function ExchangeRateForm({ currencies = [] }: ExchangeRateFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cryptoCurrencies =
    currencies.length > 0
      ? currencies.filter((c) => c.kind === "crypto")
      : [
          { code: "BNB", kind: "crypto" },
          { code: "NXR", kind: "crypto" },
          { code: "USDT", kind: "crypto" },
          { code: "BTC", kind: "crypto" },
          { code: "ETH", kind: "crypto" },
        ];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useZodForm<ExchangeRateInput>({
    schema: exchangeRateSchema as ZodSchema<ExchangeRateInput>,
    defaultValues: { baseCurrency: "USDT", rate: 1 },
  });

  async function onSubmit(data: ExchangeRateInput) {
    setServerError(null);
    setSuccess(false);

    const result = await updateExchangeRateAction(objectToFormData(data));

    if (!result.success) {
      setServerError(result.error ?? "Failed to update rate");
      return;
    }

    setSuccess(true);
    reset({ baseCurrency: data.baseCurrency, rate: 0 });
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5 sm:flex-row sm:flex-wrap sm:items-end"
      noValidate
    >
      <CurrencySelectField
        {...register("baseCurrency")}
        selectedCode={watch("baseCurrency")}
        label="Asset"
        className="border-border bg-surface/60"
      />
      {errors.baseCurrency && (
        <p className="text-xs text-red-400">{errors.baseCurrency.message}</p>
      )}
      <div className="min-w-0">
        <label htmlFor="exchange-rate" className="flex items-center gap-2 text-xs text-muted">
          Rate (<UsdAmount amount={1} size={14} /> per 1 unit)
        </label>
        <input
          {...register("rate", { valueAsNumber: true })}
          id="exchange-rate"
          type="number"
          step="0.000001"
          min="0"
          placeholder="600.00"
          className={cn("mt-1 block w-full sm:w-44", dashboardFilterControlClass)}
        />
        {errors.rate && (
          <p className="mt-1 text-xs text-red-400">{errors.rate.message}</p>
        )}
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update rate"}
      </Button>
      {serverError && <p className="w-full text-sm text-red-400">{serverError}</p>}
      {success && <p className="w-full text-sm text-emerald-400">Rate updated</p>}
    </form>
  );
}
