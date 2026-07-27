"use client";

import { useState } from "react";
import { resendConfirmationAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/Button";

type Props = {
  email: string;
};

export function ResendConfirmationForm({ email }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const fd = new FormData();
    fd.set("email", email);
    const result = await resendConfirmationAction(fd);

    if (!result.success) {
      setError(result.error ?? "Could not resend email");
    } else {
      setMessage("Confirmation email sent. Check your inbox.");
    }
    setLoading(false);
  }

  return (
    <div>
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        type="button"
        className="mt-4 w-full"
        disabled={loading}
        onClick={handleResend}
      >
        {loading ? "Sending…" : "Resend confirmation email"}
      </Button>
    </div>
  );
}
