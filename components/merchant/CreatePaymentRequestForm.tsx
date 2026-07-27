"use client";

import { useState } from "react";
import { createPaymentRequestAction } from "@/modules/invoices/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function CreatePaymentRequestForm() {
  const [error, setError] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setPayUrl(null);

    const formData = new FormData(e.currentTarget);
    const result = await createPaymentRequestAction(formData);

    if (!result.success) {
      setError(result.error ?? "Failed to create payment request");
    } else {
      setPayUrl(result.payUrl ?? null);
      setInvoiceNumber(result.invoiceNumber ?? null);
      e.currentTarget.reset();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-2xl border border-border bg-card/40 p-6">
      <Input
        name="customerEmail"
        type="email"
        label="Customer email"
        placeholder="customer@example.com"
        required
      />
      <Input
        name="amount"
        type="number"
        step="0.01"
        min="0.01"
        label="Amount (USD)"
        required
      />
      <div>
        <label className="text-sm text-muted">Description</label>
        <textarea
          name="description"
          rows={3}
          required
          className="mt-1 w-full rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm"
          placeholder="Payment for services…"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {payUrl && invoiceNumber && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
          <p className="font-medium text-emerald-400">Invoice {invoiceNumber} created</p>
          <p className="mt-2 break-all text-muted">Share link:</p>
          <a href={payUrl} className="mt-1 block break-all text-gold hover:underline">
            {payUrl}
          </a>
        </div>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create payment request"}
      </Button>
    </form>
  );
}
