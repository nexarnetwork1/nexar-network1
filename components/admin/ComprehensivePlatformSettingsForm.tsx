"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updatePlatformSettingsAction,
  updateFeeScheduleAction,
} from "@/modules/platform/actions";
import type { PlatformSettings } from "@/types";

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
    return <p className="text-zinc-400">Platform settings unavailable.</p>;
  }

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-semibold text-yellow-400">Treasury</h2>
          <Field
            label="Treasury Wallet Address"
            name="treasuryWallet"
            defaultValue={settings.treasury_wallet_address ?? ""}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-yellow-400">Fees</h2>
          {Object.entries(FEE_LABELS).map(([key, label]) => (
            <FeeField
              key={key}
              label={label}
              paymentType={key}
              defaultValue={latestFees[key] ?? 0}
              onSave={updateFee}
            />
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-yellow-400">Merchant Promotion</h2>
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
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-yellow-400">Security</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="maintenanceMode" defaultChecked={settings.maintenance_mode} />
            Maintenance Mode
          </label>
          <div>
            <label className="text-xs text-zinc-400">Platform Status</label>
            <select
              name="platformStatus"
              defaultValue={settings.platform_status}
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
            >
              <option value="operational">Operational</option>
              <option value="degraded">Degraded</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-yellow-400">Payments</h2>
          <Field
            label="Minimum Payment (USD)"
            name="minPaymentUsd"
            type="number"
            step="0.01"
            defaultValue={String(settings.min_payment_usd ?? 1)}
          />
          <Field
            label="Maximum Payment (USD)"
            name="maxPaymentUsd"
            type="number"
            step="0.01"
            defaultValue={String(settings.max_payment_usd ?? 100000)}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-yellow-400">Notifications</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="emailNotificationsEnabled"
              defaultChecked={settings.email_notifications_enabled}
            />
            Email Notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="telegramNotificationsEnabled"
              defaultChecked={settings.telegram_notifications_enabled}
            />
            Telegram Notifications (future)
          </label>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-yellow-400">Tokens & Support</h2>
          <Field label="Support Email" name="supportEmail" defaultValue={settings.support_email} />
          <Field label="NXR Token" name="nxrToken" defaultValue={settings.nxr_token_address ?? ""} />
          <Field label="USDT Token" name="usdtToken" defaultValue={settings.usdt_token_address ?? ""} />
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">Settings saved</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save platform settings"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
      />
    </div>
  );
}

function FeeField({
  label,
  paymentType,
  defaultValue,
  onSave,
}: {
  label: string;
  paymentType: string;
  defaultValue: number;
  onSave: (paymentType: string, rate: number) => Promise<void>;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label className="text-xs text-zinc-400">{label}</label>
        <input
          id={`fee-${paymentType}`}
          type="number"
          step="0.0001"
          min="0"
          max="1"
          defaultValue={defaultValue}
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          const input = document.getElementById(`fee-${paymentType}`) as HTMLInputElement;
          onSave(paymentType, Number(input.value));
        }}
        className="rounded-lg border border-yellow-500/40 px-3 py-2 text-xs text-yellow-400"
      >
        Update
      </button>
    </div>
  );
}
