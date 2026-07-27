"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useZodForm } from "@/hooks/useZodForm";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/modules/auth/validators";
import { forgotPasswordAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<ForgotPasswordInput>({
    schema: forgotPasswordSchema,
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null);
    const result = await forgotPasswordAction(objectToFormData(data));
    if (!result.success) {
      setServerError(result.error ?? "Failed to send reset email");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle="Password reset link sent">
        <p className="text-sm text-muted">
          If an account exists for that email, you will receive a reset link shortly.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-gold hover:text-gold-secondary">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" subtitle="We will email you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          {...register("email")}
          type="email"
          label="Email"
          autoComplete="email"
          error={errors.email?.message}
        />
        {serverError && <p className="text-sm text-red-400">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-gold hover:text-gold-secondary">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
