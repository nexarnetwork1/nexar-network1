"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function PlatformOwnerSetupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/hq/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          fullName: String(formData.get("fullName") ?? "NEXAR Platform Owner"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadyComplete?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Bootstrap failed");
        return;
      }
      router.replace("/admin/login?setup=1");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="mt-8 space-y-4">
      <label className="block text-left text-sm">
        <span className="text-muted">Full name</span>
        <input
          name="fullName"
          defaultValue="NEXAR Platform Owner"
          required
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground"
        />
      </label>
      <label className="block text-left text-sm">
        <span className="text-muted">Owner email</span>
        <input
          name="email"
          type="email"
          defaultValue="admin@nexarnetwork.org"
          required
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground"
        />
      </label>
      <label className="block text-left text-sm">
        <span className="text-muted">Owner password (min 12)</span>
        <input
          name="password"
          type="password"
          minLength={12}
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground"
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
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-background disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create Platform Owner"}
      </button>
    </form>
  );
}
