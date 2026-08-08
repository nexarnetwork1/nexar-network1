"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updatePlatformSettingsAction,
  updateFeeScheduleAction,
} from "@/modules/platform/actions";
import type { PlatformSettings } from "@/types";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import { Button } from "@/components/ui/Button";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { dashboardFilterControlClass } from "@/components/dashboard/DashboardFilters";
import { cn } from "@/lib/utils/cn";

type Props = {
  settings: PlatformSettings | null;
  latestFees: Record<string, number>;
};

const FEE_LABELS: Record<string, string> = {
  nxr: "NXR Fee",
  crypto_other: "Other Crypto Fee",
  card: "Card Fee",
  visa: "Visa Fee",
  mastercard: "Mastercard Fee",
  apple_pay: "Apple Pay Fee",
  google_pay: "Google Pay Fee",
};

const FEE_METHOD_KEYS = Object.keys(FEE_LABELS);

export function ComprehensivePlatformSettingsForm({ settings, latestFees }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const result = await updatePlatformSettingsAction(formData);

    if (!result.success) {
      setError(result.error ?? "Failed to save settings");
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    router.refresh();
  }

  async function updateFee(paymentType: string, baseRate: number) {
    setError(null);
    const result = await updateFeeScheduleAction(paymentType, baseRate);
    if (!result.success) {
      setError(result.error ?? "Failed to update fee");
      return;
    }
    router.refresh();
  }

  if (!settings) {
    return <p className="text-muted">Platform settings unavailable.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <SettingsGroup title="Treasury">
        <Field
          label="Treasury Wallet Address"
          name="treasuryWallet"
          defaultValue={settings.treasury_wallet_address ?? ""}
        />
      </SettingsGroup>

      <SettingsGroup title="Fees">
        {FEE_METHOD_KEYS.map((key) => (
          <FeeField
            key={key}
            paymentType={key}
            defaultValue={latestFees[key] ?? 0}
            onSave={updateFee}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title="Merchant Promotion">
        <Field
          label="New Merchant Discount (0–1)"
          name="merchantPromotionDiscountPercent"
          type="number"
          step="0.0001"
          defaultValue={String(settings.merchant_promotion_discount_percent ?? 0.1)}
        />
        <Field
          label="Promotion Duration (days)"
          name="merchantPromotionDurationDays"
          type="number"
          defaultValue={String(settings.merchant_promotion_duration_days ?? 90)}
        />
      </SettingsGroup>

      <SettingsGroup title="Security">
        <Checkbox
          name="maintenanceMode"
          label="Maintenance Mode"
          defaultChecked={settings.maintenance_mode}
        />
        <div>
          <label htmlFor="platformStatus" className="text-xs text-muted">
            Platform Status
          </label>
          <select
            id="platformStatus"
            name="platformStatus"
            defaultValue={settings.platform_status}
            className={cn("mt-1 w-full", dashboardFilterControlClass)}
          >
            <option value="operational">Operational</option>
            <option value="degraded">Degraded</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Payments">
        <Field
          label="Minimum Payment"
          name="minPaymentUsd"
          type="number"
          step="0.01"
          defaultValue={String(settings.min_payment_usd ?? 1)}
          suffix={<UsdAmount amount={1} size={14} />}
        />
        <Field
          label="Maximum Payment"
          name="maxPaymentUsd"
          type="number"
          step="0.01"
          defaultValue={String(settings.max_payment_usd ?? 100000)}
          suffix={<UsdAmount amount={1} size={14} />}
        />
      </SettingsGroup>

      <SettingsGroup title="Notifications">
        <Checkbox
          name="emailNotificationsEnabled"
          label="Email Notifications"
          defaultChecked={settings.email_notifications_enabled}
        />
        <Checkbox
          name="telegramNotificationsEnabled"
          label="Telegram Notifications (future)"
          defaultChecked={settings.telegram_notifications_enabled}
        />
      </SettingsGroup>

      <SettingsGroup title="Tokens & Support">
        <Field label="Support Email" name="supportEmail" defaultValue={settings.support_email} />
        <Field
          label="NXR Token"
          name="nxrToken"
          defaultValue={settings.nxr_token_address ?? ""}
          prefix={<PaymentMethodLogo method="nxr" size={18} showLabel={false} />}
        />
        <Field
          label="USDT Token"
          name="usdtToken"
          defaultValue={settings.usdt_token_address ?? ""}
          prefix={<PaymentMethodLogo method="usdt" size={18} showLabel={false} />}
        />
      </SettingsGroup>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-success">Settings saved</p>}

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving…" : "Save platform settings"}
      </Button>
    </form>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <DashboardCard as="section" className="space-y-4">
      <h2 className="font-heading text-base font-semibold text-gold">{title}</h2>
      {children}
    </DashboardCard>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label htmlFor={name} className="flex min-h-11 items-center gap-2.5 text-sm text-white">
      <input
        id={name}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border bg-surface accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      />
      {label}
    </label>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  prefix,
  suffix,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  step?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="flex items-center gap-2 text-xs text-muted">
        {prefix}
        {label}
        {suffix && <span className="inline-flex items-center">({suffix})</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        className={cn("mt-1 w-full", dashboardFilterControlClass)}
      />
    </div>
  );
}

function FeeField({
  paymentType,
  defaultValue,
  onSave,
}: {
  paymentType: string;
  defaultValue: number;
  onSave: (paymentType: string, rate: number) => Promise<void>;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="min-w-0 flex-1">
        <label
          htmlFor={`fee-${paymentType}`}
          className="flex items-center gap-2 text-xs text-muted"
        >
          <PaymentMethodLogo method={paymentType} size={18} showLabel={false} />
          {FEE_LABELS[paymentType] ?? paymentType}
        </label>
        <input
          id={`fee-${paymentType}`}
          type="number"
          step="0.0001"
          min="0"
          max="1"
          defaultValue={defaultValue}
          className={cn("mt-1 w-full", dashboardFilterControlClass)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const input = document.getElementById(`fee-${paymentType}`) as HTMLInputElement;
          onSave(paymentType, Number(input.value));
        }}
      >
        Update
      </Button>
    </div>
  );
}
