"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useZodForm } from "@/hooks/useZodForm";
import { resetPasswordSchema, type ResetPasswordInput } from "@/modules/auth/validators";
import { resetPasswordAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<ResetPasswordInput>({
    schema: resetPasswordSchema,
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token || !email) {
    return (
      <AuthCard title="Invalid reset link" subtitle="This link is missing or incomplete">
        <p className="text-sm text-muted">
          Password reset links expire after one hour. Request a new link to continue.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className="inline-flex h-11 items-center justify-center rounded-[var(--nxr-radius-button)] border border-gold/30 bg-gold px-4 text-sm font-semibold text-on-gold hover:bg-gold-hover"
          >
            Request new link
          </Link>
          <Link href="/login" className="text-center text-sm text-gold hover:text-gold-secondary">
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  const resetToken = token;
  const resetEmail = email;

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    const formData = objectToFormData(data);
    formData.set("token", resetToken);
    formData.set("email", resetEmail);
    const result = await resetPasswordAction(formData);
    if (!result.success) {
      setServerError(result.error ?? "Failed to reset password");
      return;
    }
    router.push(result.redirectTo ?? "/login?message=password_reset");
    router.refresh();
  }

  return (
    <AuthCard title="Reset password" subtitle="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          {...register("password")}
          type="password"
          label="New password"
          autoComplete="new-password"
          error={errors.password?.message}
        />
        <Input
          {...register("confirmPassword")}
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
        />
        {serverError && <p className="text-sm text-red-400">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
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

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Reset password" subtitle="Loading…">
          <p className="text-sm text-muted">Preparing password reset…</p>
        </AuthCard>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
