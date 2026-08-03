"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStoreSettingsAction } from "@/modules/stores/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CurrencySelectField } from "@/components/payments/CurrencySelectField";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import type { StoreSettings } from "@/types";

type StoreSettingsFormProps = {
  settings: StoreSettings;
};

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateStoreSettingsAction(formData);

    if (!result.success) {
      setError(result.error ?? "Update failed");
    } else {
      setSuccess(true);
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-lg space-y-4 nxr-card p-6">
      <Input
        name="notificationEmail"
        type="email"
        label="Notification email"
        defaultValue={settings.notification_email ?? ""}
      />
      <div>
        <label className="mb-1 flex items-center gap-2 text-sm text-muted">
          Minimum order amount (<UsdAmount amount={1} size={14} />)
        </label>
        <Input
          name="minOrderAmountUsd"
          type="number"
          step="0.01"
          min="0"
          defaultValue={String(settings.min_order_amount_usd)}
        />
      </div>
      <CurrencySelectField
        name="defaultCurrency"
        defaultValue={settings.default_currency}
        label="Default currency"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          name="autoAcceptOrders"
          type="checkbox"
          defaultChecked={settings.auto_accept_orders}
          className="rounded border-border"
        />
        Auto-accept orders
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="acceptsCrypto"
          type="checkbox"
          defaultChecked={settings.accepts_crypto}
          className="rounded border-border"
        />
        Accept cryptocurrency
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="acceptsCard"
          type="checkbox"
          defaultChecked={settings.accepts_card}
          className="rounded border-border"
        />
        Accept card payments (Stripe)
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Settings saved</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
