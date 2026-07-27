"use client";

import { cn } from "@/lib/utils/cn";
import type { SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({
  className,
  label,
  error,
  id,
  options,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-muted"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm text-white",
          "outline-none transition-colors appearance-none",
          "focus:border-gold/40 focus:ring-1 focus:ring-gold/20",
          error && "border-red-500/50",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
