"use client";

import { useState, useTransition } from "react";
import { submitContactMessageAction } from "@/modules/contact/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await submitContactMessageAction(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  if (success) {
    return (
      <p className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-sm text-gold">
        Thank you — your message was received. We will respond via email if needed.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Name" required disabled={pending} />
        <Input name="email" type="email" label="Email" required disabled={pending} />
      </div>
      <Input name="subject" label="Subject" required disabled={pending} />
      <Textarea name="message" label="Message" rows={5} required disabled={pending} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
