"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ChangePasswordForm({
  hq,
  userId,
}: {
  hq: boolean;
  userId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/hq/owner-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword: String(formData.get("currentPassword") ?? ""),
          newPassword: String(formData.get("newPassword") ?? ""),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not change password");
        return;
      }
      router.replace(hq ? "/auth/enable-2fa?hq=1" : "/dashboard");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="mt-8 space-y-4">
      <label className="block text-sm">
        <span className="text-muted">Current password</span>
        <input
          name="currentPassword"
          type="password"
          required
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">New password (min 12)</span>
        <input
          name="newPassword"
          type="password"
          minLength={12}
          required
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-background disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
