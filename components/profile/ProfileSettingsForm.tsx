"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/hooks/useZodForm";
import {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  changeWalletSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type ChangeEmailInput,
  type ChangeWalletInput,
} from "@/modules/auth/validators";
import {
  updateProfileAction,
  changePasswordAction,
  changeEmailAction,
  changeWalletAction,
} from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

type ProfileSettingsFormProps = {
  profile: Profile;
};

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "password" | "email" | "wallet">("profile");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileForm = useZodForm<UpdateProfileInput>({
    schema: updateProfileSchema,
    defaultValues: {
      fullName: profile.full_name ?? "",
      singleSession: profile.single_session_enabled ?? false,
    },
  });

  const passwordForm = useZodForm<ChangePasswordInput>({
    schema: changePasswordSchema,
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const emailForm = useZodForm<ChangeEmailInput>({
    schema: changeEmailSchema,
    defaultValues: { email: profile.email ?? "", password: "" },
  });

  const walletForm = useZodForm<ChangeWalletInput>({
    schema: changeWalletSchema,
    defaultValues: {
      walletAddress: profile.wallet_address ?? "",
      confirmWalletAddress: profile.wallet_address ?? "",
      password: "",
    },
  });

  async function submitProfile(data: UpdateProfileInput) {
    setError(null);
    setMessage(null);
    const fd = objectToFormData(data);
    if (data.singleSession) fd.set("singleSession", "on");
    const result = await updateProfileAction(fd);
    if (!result.success) {
      setError(result.error ?? "Update failed");
      return;
    }
    setMessage("Profile updated");
    router.refresh();
  }

  async function submitPassword(data: ChangePasswordInput) {
    setError(null);
    setMessage(null);
    const result = await changePasswordAction(objectToFormData(data));
    if (!result.success) {
      setError(result.error ?? "Password change failed");
      return;
    }
    setMessage("Password updated");
    passwordForm.reset();
  }

  async function submitEmail(data: ChangeEmailInput) {
    setError(null);
    setMessage(null);
    const result = await changeEmailAction(objectToFormData(data));
    if (!result.success) {
      setError(result.error ?? "Email change failed");
      return;
    }
    if (result.redirectTo) {
      router.push(result.redirectTo);
    }
  }

  async function submitWallet(data: ChangeWalletInput) {
    setError(null);
    setMessage(null);
    const result = await changeWalletAction(objectToFormData(data));
    if (!result.success) {
      setError(result.error ?? "Wallet update failed");
      return;
    }
    setMessage("Wallet updated");
    walletForm.reset({
      walletAddress: data.walletAddress,
      confirmWalletAddress: data.walletAddress,
      password: "",
    });
    router.refresh();
  }

  const tabs = [
    { id: "profile" as const, label: "Profile" },
    { id: "password" as const, label: "Password" },
    { id: "email" as const, label: "Email" },
    { id: "wallet" as const, label: "Wallet" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setError(null);
              setMessage(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t.id ? "bg-gold/10 text-gold" : "text-muted hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {tab === "profile" && (
        <form
          onSubmit={profileForm.handleSubmit(submitProfile)}
          className="mt-6 max-w-md space-y-4"
          noValidate
        >
          <Input
            {...profileForm.register("fullName")}
            label="Full name"
            error={profileForm.formState.errors.fullName?.message}
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              {...profileForm.register("singleSession")}
              className="rounded border-border"
            />
            Single active session (sign out other devices on login)
          </label>
          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
            Save profile
          </Button>
        </form>
      )}

      {tab === "password" && (
        <form
          onSubmit={passwordForm.handleSubmit(submitPassword)}
          className="mt-6 max-w-md space-y-4"
          noValidate
        >
          <Input
            {...passwordForm.register("currentPassword")}
            type="password"
            label="Current password"
            autoComplete="current-password"
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            {...passwordForm.register("password")}
            type="password"
            label="New password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.password?.message}
          />
          <Input
            {...passwordForm.register("confirmPassword")}
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
            Change password
          </Button>
        </form>
      )}

      {tab === "email" && (
        <form
          onSubmit={emailForm.handleSubmit(submitEmail)}
          className="mt-6 max-w-md space-y-4"
          noValidate
        >
          <p className="text-sm text-muted">
            Changing your email requires verification. You will be signed out after submitting.
          </p>
          <Input
            {...emailForm.register("email")}
            type="email"
            label="New email"
            autoComplete="email"
            error={emailForm.formState.errors.email?.message}
          />
          <Input
            {...emailForm.register("password")}
            type="password"
            label="Confirm with password"
            autoComplete="current-password"
            error={emailForm.formState.errors.password?.message}
          />
          <Button type="submit" disabled={emailForm.formState.isSubmitting}>
            Update email
          </Button>
        </form>
      )}

      {tab === "wallet" && (
        <form
          onSubmit={walletForm.handleSubmit(submitWallet)}
          className="mt-6 max-w-md space-y-4"
          noValidate
        >
          <p className="text-sm text-muted">
            Enter your wallet address twice and confirm with your password.
          </p>
          <Input
            {...walletForm.register("walletAddress")}
            label="Wallet address"
            error={walletForm.formState.errors.walletAddress?.message}
          />
          <Input
            {...walletForm.register("confirmWalletAddress")}
            label="Confirm wallet address"
            error={walletForm.formState.errors.confirmWalletAddress?.message}
          />
          <Input
            {...walletForm.register("password")}
            type="password"
            label="Password"
            autoComplete="current-password"
            error={walletForm.formState.errors.password?.message}
          />
          <Button type="submit" disabled={walletForm.formState.isSubmitting}>
            Update wallet
          </Button>
        </form>
      )}
    </div>
  );
}
