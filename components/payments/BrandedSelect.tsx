"use client";

import { cn } from "@/lib/utils/cn";
import { CurrencyLogo } from "./CurrencyLogo";
import { PaymentMethodLogo } from "./PaymentMethodLogo";
import {
  BRANDED_CURRENCIES,
  BRANDED_PAYMENT_METHODS,
  getCurrencyMeta,
  getPaymentMethodLabel,
  type PaymentMethodCode,
} from "@/lib/constants/payment-branding";

type BrandedCurrencySelectProps = {
  value: string;
  onChange: (value: string) => void;
  currencies?: readonly string[];
  className?: string;
  id?: string;
  name?: string;
};

export function BrandedCurrencySelect({
  value,
  onChange,
  currencies = BRANDED_CURRENCIES,
  className,
  id,
  name,
}: BrandedCurrencySelectProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-lg border border-border bg-surface px-3 py-2 text-sm",
        className
      )}
    >
      {currencies.map((code) => {
        const meta = getCurrencyMeta(code);
        return (
          <option key={code} value={code}>
            {meta.symbol} — {meta.label}
          </option>
        );
      })}
    </select>
  );
}

type BrandedCurrencyOptionProps = {
  code: string;
  selected?: boolean;
};

export function BrandedCurrencyOption({ code }: BrandedCurrencyOptionProps) {
  const meta = getCurrencyMeta(code);
  return (
    <span className="inline-flex items-center gap-2">
      <CurrencyLogo code={code} size={16} />
      <span>{meta.symbol}</span>
    </span>
  );
}

type BrandedPaymentMethodSelectProps = {
  value: string;
  onChange: (value: string) => void;
  methods?: PaymentMethodCode[];
  className?: string;
  id?: string;
  name?: string;
};

export function BrandedPaymentMethodSelect({
  value,
  onChange,
  methods = BRANDED_PAYMENT_METHODS,
  className,
  id,
  name,
}: BrandedPaymentMethodSelectProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-lg border border-border bg-surface px-3 py-2 text-sm",
        className
      )}
    >
      {methods.map((method) => (
        <option key={method} value={method}>
          {getPaymentMethodLabel(method)}
        </option>
      ))}
    </select>
  );
}

type PaymentMethodPickerProps = {
  methods: string[];
  selected: string;
  onSelect: (method: string) => void;
  className?: string;
};

export function PaymentMethodPicker({
  methods,
  selected,
  onSelect,
  className,
}: PaymentMethodPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {methods.map((method) => {
        const active = selected === method;
        return (
          <button
            key={method}
            type="button"
            onClick={() => onSelect(method)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
              active
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted hover:text-white"
            )}
          >
            <PaymentMethodLogo method={method} size={18} showLabel />
          </button>
        );
      })}
    </div>
  );
}
