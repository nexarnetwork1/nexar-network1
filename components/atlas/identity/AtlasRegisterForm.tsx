"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useZodForm } from "@/hooks/useZodForm";
import { atlasRegisterFormSchema, type AtlasRegisterFormInput } from "@/schemas";
import { registerCustomerAction } from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";
import {
  AtlasIdentityDivider,
  AtlasIdentityField,
} from "@/components/atlas/identity/AtlasIdentityFields";
import { AtlasOAuthButtons } from "@/components/atlas/identity/AtlasOAuthButtons";

type AtlasRegisterFormProps = {
  redirect: string | null;
  onSuccess: (destination: string) => void;
  onSwitchSignIn: () => void;
};

export function AtlasRegisterForm({
  redirect,
  onSuccess,
  onSwitchSignIn,
}: AtlasRegisterFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useZodForm<AtlasRegisterFormInput>({
    schema: atlasRegisterFormSchema,
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      walletAddress: "",
    },
  });

  async function onSubmit(data: AtlasRegisterFormInput) {
    setServerError(null);
    const { confirmPassword: _confirm, ...payload } = data;
    const result = await registerCustomerAction(objectToFormData(payload));
    if (!result.success) {
      setServerError(result.error ?? "Registration failed");
      return;
    }
    if (result.needsEmailConfirmation) {
      onSuccess("/login?message=confirm_email");
      return;
    }
    onSuccess(result.redirectTo ?? redirect ?? "/atlas");
  }

  return (
    <motion.div
      key="atlas-register"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <p className="text-xs text-muted text-center leading-relaxed">
        One ATLAS identity for Marketplace, Business, Network, and more.
      </p>

      <AtlasOAuthButtons
        redirectTo={redirect ?? undefined}
        onWalletAddress={(address) => setValue("walletAddress", address, { shouldValidate: true })}
        layout="stack"
      />
      <AtlasIdentityDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <AtlasIdentityField
          id="atlas-register-name"
          label="Full name"
          placeholder="John Doe"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <AtlasIdentityField
          id="atlas-register-username"
          label="Username"
          placeholder="johndoe"
          autoComplete="username"
          spellCheck={false}
          error={errors.username?.message}
          {...register("username")}
        />
        <AtlasIdentityField
          id="atlas-register-email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <AtlasIdentityField
          id="atlas-register-password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <AtlasIdentityField
          id="atlas-register-confirm"
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <AtlasIdentityField
          id="atlas-register-wallet"
          label="Wallet (optional)"
          placeholder="0x… or connect above"
          spellCheck={false}
          error={errors.walletAddress?.message}
          {...register("walletAddress")}
        />
        {serverError ? (
          <p className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {serverError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold px-4 py-3 text-sm font-semibold text-on-gold hover:bg-gold-accent disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchSignIn} className="text-gold hover:underline">
          Sign in
        </button>
      </p>
    </motion.div>
  );
}
