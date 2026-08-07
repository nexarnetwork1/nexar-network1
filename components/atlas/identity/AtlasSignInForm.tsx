"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useZodForm } from "@/hooks/useZodForm";
import { loginSchema, type LoginInput } from "@/schemas";
import { loginAction, resendConfirmationAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";
import {
  AtlasIdentityDivider,
  AtlasIdentityField,
  AtlasIdentityMessage,
} from "@/components/atlas/identity/AtlasIdentityFields";
import { AtlasOAuthButtons } from "@/components/atlas/identity/AtlasOAuthButtons";

type AtlasSignInFormProps = {
  redirect: string | null;
  message: string | null;
  onSuccess: (destination: string) => void;
  onSwitchRegister: () => void;
};

export function AtlasSignInForm({
  redirect,
  message,
  onSuccess,
  onSwitchRegister,
}: AtlasSignInFormProps) {
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
    formData.set("redirect", redirect ?? "/dashboard");
    const rememberMe = (document.getElementById("atlas-identity-remember") as HTMLInputElement)
      ?.checked;
    formData.set("rememberMe", rememberMe ? "true" : "false");

    const result = await loginAction(formData);
    if (!result.success) {
      setServerError(result.error ?? "Login failed");
      setResendEmail(data.email);
      return;
    }
    onSuccess(result.redirectTo ?? redirect ?? "/dashboard");
  }

  return (
    <motion.div
      key="atlas-signin"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {message === "confirm_email" ? (
        <AtlasIdentityMessage tone="info">
          Confirm your email, then sign in to continue.
        </AtlasIdentityMessage>
      ) : null}
      {message === "password_reset" ? (
        <AtlasIdentityMessage tone="success">
          Password updated successfully. Sign in with your new password.
        </AtlasIdentityMessage>
      ) : null}
      {message === "auth_callback_failed" ? (
        <AtlasIdentityMessage tone="error">
          Social sign-in could not be completed. Try again or use email and password.
        </AtlasIdentityMessage>
      ) : null}

      <AtlasOAuthButtons redirectTo={redirect ?? undefined} layout="stack" />
      <AtlasIdentityDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <AtlasIdentityField
          id="atlas-signin-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <AtlasIdentityField
          id="atlas-signin-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 text-muted">
            <input
              id="atlas-identity-remember"
              type="checkbox"
              className="rounded border-white/20 bg-black/50 accent-gold"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-gold hover:text-gold-secondary">
            Forgot password?
          </Link>
        </div>
        {serverError ? (
          <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">{serverError}</p>
            {resendEmail && message !== "confirm_email" ? (
              <button
                type="button"
                onClick={async () => {
                  const fd = new FormData();
                  fd.set("email", resendEmail);
                  await resendConfirmationAction(fd);
                }}
                className="mt-2 text-xs text-gold hover:underline"
              >
                Resend confirmation email
              </button>
            ) : null}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold px-4 py-3 text-sm font-semibold tracking-wide text-background transition-colors hover:bg-gold-secondary disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        New to ATLAS?{" "}
        <button type="button" onClick={onSwitchRegister} className="text-gold hover:underline">
          Create an account
        </button>
      </p>
    </motion.div>
  );
}
