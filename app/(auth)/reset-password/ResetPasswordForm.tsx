"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useZodForm } from "@/hooks/useZodForm";
import { resetPasswordSchema, type ResetPasswordInput } from "@/modules/auth/validators";
import { resetPasswordAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<ResetPasswordInput>({
    schema: resetPasswordSchema,
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    const result = await resetPasswordAction(objectToFormData(data));
    if (!result.success) {
      setServerError(result.error ?? "Failed to reset password");
      return;
    }
    router.push(result.redirectTo ?? "/login");
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
