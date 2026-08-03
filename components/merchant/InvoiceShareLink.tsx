"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type InvoiceShareLinkProps = {
  payUrl: string;
};

export function InvoiceShareLink({ payUrl }: InvoiceShareLinkProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(payUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/60 p-5">
      <p className="text-sm font-medium">Customer pay link</p>
      <p className="mt-1 text-xs text-muted">Share this secure link with your customer</p>
      <p className="mt-3 break-all font-mono text-xs text-gold-secondary">{payUrl}</p>
      <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={copyLink}>
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
