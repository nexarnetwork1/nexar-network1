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

export function ExchangeRateForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
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
      <div>
        <label className="text-xs text-zinc-400">Asset</label>
        <select
          {...register("baseCurrency")}
          className="mt-1 block rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="BNB">BNB</option>
          <option value="NXR">NXR</option>
          <option value="USDT">USDT</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>
        {errors.baseCurrency && (
          <p className="mt-1 text-xs text-red-400">{errors.baseCurrency.message}</p>
        )}
      </div>
      <div>
        <label className="text-xs text-zinc-400">Rate (USD per 1 unit)</label>
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
