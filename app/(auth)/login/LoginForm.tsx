"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useZodForm } from "@/hooks/useZodForm";
import { loginSchema, type LoginInput } from "@/schemas";
import { loginAction, resendConfirmationAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect =
    searchParams.get("redirect") ?? searchParams.get("next") ?? undefined;
  const message = searchParams.get("message");

  const [serverError, setServerError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<LoginInput>({
    schema: loginSchema,
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);

    const formData = objectToFormData(data);
    if (redirect) formData.set("redirect", redirect);
    const rememberMe = (document.getElementById("rememberMe") as HTMLInputElement)?.checked;
    formData.set("rememberMe", rememberMe ? "true" : "false");

    const result = await loginAction(formData);

    if (!result.success) {
      setServerError(result.error ?? "Login failed");
      setResendEmail(data.email);
      return;
    }

    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  async function handleResend() {
    if (!resendEmail) return;
    const fd = new FormData();
    fd.set("email", resendEmail);
    await resendConfirmationAction(fd);
  }

  return (
    <AuthCard title="Sign in" subtitle="Access your Nexar Network account">
      {message === "confirm_email" && (
        <p className="mb-6 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-gold-secondary">
          Check your email to confirm your account, then sign in.
        </p>
      )}
      {message === "password_reset" && (
        <p className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          Password updated. You can sign in with your new password.
        </p>
      )}

      <SocialAuthButtons redirectTo={redirect} />

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted uppercase tracking-wider">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <Input
          {...register("email")}
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
        />
        <Input
          {...register("password")}
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input id="rememberMe" type="checkbox" className="rounded border-border" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-gold hover:text-gold-secondary">
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <div>
            <p className="text-sm text-red-400">{serverError}</p>
            {resendEmail && message !== "confirm_email" && (
              <button
                type="button"
                onClick={handleResend}
                className="mt-2 text-xs text-gold hover:underline"
              >
                Resend confirmation email
              </button>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-gold hover:text-gold-secondary">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}
