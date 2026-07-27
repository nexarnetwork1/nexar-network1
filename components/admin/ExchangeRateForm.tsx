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
      className="flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-6"
      noValidate
    >
      <CurrencySelectField
        {...register("baseCurrency")}
        selectedCode={watch("baseCurrency")}
        label="Asset"
        className="border-white/10 bg-zinc-950"
      />
      {errors.baseCurrency && (
        <p className="text-xs text-red-400">{errors.baseCurrency.message}</p>
      )}
      <div>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          Rate (<UsdAmount amount={1} size={14} /> per 1 unit)
        </label>
        <input
          {...register("rate", { valueAsNumber: true })}
          type="number"
          step="0.000001"
          min="0"
          placeholder="600.00"
          className="mt-1 block rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
        />
        {errors.rate && (
          <p className="mt-1 text-xs text-red-400">{errors.rate.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {isSubmitting ? "Updating…" : "Update rate"}
      </button>
      {serverError && <p className="w-full text-sm text-red-400">{serverError}</p>}
      {success && <p className="w-full text-sm text-emerald-400">Rate updated</p>}
    </form>
  );
}
