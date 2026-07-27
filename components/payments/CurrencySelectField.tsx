"use client";

import { cn } from "@/lib/utils/cn";
import {
  BRANDED_CURRENCIES,
  getCurrencyMeta,
} from "@/lib/constants/payment-branding";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";

type CurrencySelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  showLogo?: boolean;
  selectedCode?: string;
  containerClassName?: string;
};

export function CurrencySelectField({
  label,
  includeEmpty = false,
  emptyLabel = "All currencies",
  showLogo = true,
  selectedCode,
  containerClassName,
  className,
  defaultValue,
  ...selectProps
}: CurrencySelectFieldProps) {
  const displayCode = selectedCode ?? String(defaultValue ?? "USD");

  return (
    <div className={containerClassName}>
      {label && <label className="text-xs text-zinc-400">{label}</label>}
      <div className={cn("flex items-center gap-2", label && "mt-1")}>
        {showLogo && displayCode && (!includeEmpty || displayCode) && (
          <CurrencyLogo code={displayCode} size={20} showLabel={false} />
        )}
        <select
          {...selectProps}
          defaultValue={defaultValue}
          className={cn(
            "flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm",
            className
          )}
        >
          {includeEmpty && <option value="">{emptyLabel}</option>}
          {BRANDED_CURRENCIES.map((code) => {
            const meta = getCurrencyMeta(code);
            return (
              <option key={code} value={code}>
                {meta.symbol} — {meta.label}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
