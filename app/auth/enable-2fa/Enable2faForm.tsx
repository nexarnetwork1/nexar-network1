"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function Enable2faForm({ hq, userId }: { hq: boolean; userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/hq/owner-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, confirmed: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not enable 2FA");
        return;
      }
      router.replace(hq ? "/admin/dashboard" : "/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-4">
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
        Authenticator enrollment foundation is active. Confirm to mark 2FA as
        required-complete for this Platform Owner session path. Wire a TOTP
        secret UI here without changing HQ gates.
      </p>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={onConfirm}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-background disabled:opacity-60"
      >
        {pending ? "Enabling…" : "Confirm 2FA enabled"}
      </button>
    </div>
  );
}
