"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Store, UserRound } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useZodForm } from "@/hooks/useZodForm";
import {
  customerRegisterSchema,
  loginSchema,
  merchantRegisterSchema,
  type CustomerRegisterInput,
  type LoginInput,
  type MerchantRegisterInput,
} from "@/schemas";
import {
  loginAction,
  registerCustomerAction,
  registerMerchantAction,
  resendConfirmationAction,
} from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";
import { cn } from "@/lib/utils/cn";

type AuthModalView = "signin" | "register-choice" | "register-customer" | "register-merchant";

type AuthModalPanelProps = {
  view: AuthModalView;
  redirect: string | null;
  message: string | null;
  onViewChange: (view: AuthModalView) => void;
  onSuccess: (destination: string) => void;
};

export function AuthModalPanel({
  view,
  redirect,
  message,
  onViewChange,
  onSuccess,
}: AuthModalPanelProps) {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-5 flex justify-center">
        <Logo showText={false} />
      </div>
      <p id="auth-modal-title" className="text-center font-heading text-lg font-semibold text-gold">
        Nexar Network
      </p>
      <p className="mt-1 text-center text-xs text-muted">
        Sign in to Nexar Commerce or create your account
      </p>

      {view === "signin" ? (
        <SignInPanel
          redirect={redirect}
          message={message}
          onRegister={() => onViewChange("register-choice")}
          onSuccess={onSuccess}
        />
      ) : null}

      {view === "register-choice" ? (
        <RegisterChoicePanel
          onBack={() => onViewChange("signin")}
          onCustomer={() => onViewChange("register-customer")}
          onMerchant={() => onViewChange("register-merchant")}
        />
      ) : null}

      {view === "register-customer" ? (
        <CustomerRegisterPanel
          redirect={redirect}
          onBack={() => onViewChange("register-choice")}
          onSignIn={() => onViewChange("signin")}
          onSuccess={onSuccess}
        />
      ) : null}

      {view === "register-merchant" ? (
        <MerchantRegisterPanel
          onBack={() => onViewChange("register-choice")}
          onSignIn={() => onViewChange("signin")}
          onSuccess={onSuccess}
        />
      ) : null}
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs tracking-wide text-muted uppercase">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function SignInPanel({
  redirect,
  message,
  onRegister,
  onSuccess,
}: {
  redirect: string | null;
  message: string | null;
  onRegister: () => void;
  onSuccess: (destination: string) => void;
}) {
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
    formData.set("redirect", redirect ?? "/marketplace");
    const rememberMe = (document.getElementById("auth-rememberMe") as HTMLInputElement)?.checked;
    formData.set("rememberMe", rememberMe ? "true" : "false");

    const result = await loginAction(formData);
    if (!result.success) {
      setServerError(result.error ?? "Login failed");
      setResendEmail(data.email);
      return;
    }

    onSuccess(result.redirectTo ?? redirect ?? "/marketplace");
  }

  return (
    <div className="mt-5">
      <h2 className="font-heading text-base font-medium text-white">Sign in</h2>
      <p className="mt-1 text-xs text-muted">Access your Nexar Commerce account</p>

      {message === "confirm_email" ? (
        <p className="mt-4 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-xs text-gold-secondary">
          Check your email to confirm your account, then sign in.
        </p>
      ) : null}
      {message === "password_reset" ? (
        <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400">
          Password updated. You can sign in with your new password.
        </p>
      ) : null}

      <div className="mt-4">
        <SocialAuthButtons redirectTo={redirect ?? undefined} />
      </div>
      <AuthDivider />

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
            <input id="auth-rememberMe" type="checkbox" className="rounded border-border" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-secondary">
            Forgot password?
          </Link>
        </div>
        {serverError ? (
          <div>
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onRegister} className="text-gold hover:text-gold-secondary">
          Create account
        </button>
      </p>
    </div>
  );
}

function RegisterChoicePanel({
  onBack,
  onCustomer,
  onMerchant,
}: {
  onBack: () => void;
  onCustomer: () => void;
  onMerchant: () => void;
}) {
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to sign in
      </button>
      <h2 className="font-heading text-base font-medium text-white">Create account</h2>
      <p className="mt-1 text-xs text-muted">Choose how you want to use Nexar Commerce</p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={onCustomer}
          className={cn(
            "flex w-full items-start gap-4 rounded-xl border border-border/70 bg-background/40 p-4 text-left",
            "transition-colors hover:border-gold/30 hover:bg-gold/5",
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
            <UserRound className="h-5 w-5 text-gold" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-medium text-white">Customer</span>
            <span className="mt-1 block text-xs text-muted">
              Browse the marketplace, save wishlists, and checkout with crypto or card.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onMerchant}
          className={cn(
            "flex w-full items-start gap-4 rounded-xl border border-border/70 bg-background/40 p-4 text-left",
            "transition-colors hover:border-gold/30 hover:bg-gold/5",
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
            <Store className="h-5 w-5 text-gold" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-medium text-white">Merchant</span>
            <span className="mt-1 block text-xs text-muted">
              Launch your storefront, list products, and accept payments on Nexar Network.
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function CustomerRegisterPanel({
  redirect,
  onBack,
  onSignIn,
  onSuccess,
}: {
  redirect: string | null;
  onBack: () => void;
  onSignIn: () => void;
  onSuccess: (destination: string) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<CustomerRegisterInput>({
    schema: customerRegisterSchema,
    defaultValues: { fullName: "", email: "", password: "", walletAddress: "" },
  });

  async function onSubmit(data: CustomerRegisterInput) {
    setServerError(null);
    const result = await registerCustomerAction(objectToFormData(data));
    if (!result.success) {
      setServerError(result.error ?? "Registration failed");
      return;
    }
    if (result.needsEmailConfirmation) {
      onSuccess("/marketplace?auth=signin&message=confirm_email");
      return;
    }
    onSuccess(result.redirectTo ?? redirect ?? "/marketplace");
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back
      </button>
      <h2 className="font-heading text-base font-medium text-white">Customer account</h2>
      <p className="mt-1 text-xs text-muted">Browse, buy, and pay with crypto or card</p>

      <div className="mt-4">
        <SocialAuthButtons intent="customer" redirectTo={redirect ?? "/marketplace"} />
      </div>
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <Input {...register("fullName")} label="Full name" placeholder="John Doe" error={errors.fullName?.message} />
        <Input {...register("email")} type="email" label="Email" placeholder="you@example.com" error={errors.email?.message} />
        <Input {...register("password")} type="password" label="Password" placeholder="Min. 8 characters" error={errors.password?.message} />
        <Input {...register("walletAddress")} label="Wallet address (BSC)" placeholder="0x..." spellCheck={false} error={errors.walletAddress?.message} />
        {serverError ? <p className="text-sm text-red-400">{serverError}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create customer account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <button type="button" onClick={onSignIn} className="text-gold hover:text-gold-secondary">
          Sign in
        </button>
      </p>
    </div>
  );
}

function MerchantRegisterPanel({
  onBack,
  onSignIn,
  onSuccess,
}: {
  onBack: () => void;
  onSignIn: () => void;
  onSuccess: (destination: string) => void;
}) {
  const logoRef = useRef<HTMLInputElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<MerchantRegisterInput>({
    schema: merchantRegisterSchema,
    defaultValues: {
      merchantName: "",
      storeName: "",
      businessType: "",
      email: "",
      password: "",
      walletAddress: "",
      mode: "marketplace",
    },
  });

  async function onSubmit(data: MerchantRegisterInput) {
    setServerError(null);
    const formData = objectToFormData(data);
    const logoFile = logoRef.current?.files?.[0];
    if (logoFile) formData.set("logo", logoFile);

    const result = await registerMerchantAction(formData);
    if (!result.success) {
      setServerError(result.error ?? "Registration failed");
      return;
    }
    if (result.needsEmailConfirmation) {
      onSuccess("/marketplace?auth=signin&message=confirm_email");
      return;
    }
    onSuccess(result.redirectTo ?? "/merchant/onboarding");
  }

  async function onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSubmit(onSubmit)(event);
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back
      </button>
      <h2 className="font-heading text-base font-medium text-white">Merchant onboarding</h2>
      <p className="mt-1 text-xs text-muted">Launch your storefront on Nexar Commerce</p>

      <div className="mt-4">
        <SocialAuthButtons intent="merchant" redirectTo="/merchant/onboarding" />
      </div>
      <AuthDivider />

      <form onSubmit={onFormSubmit} className="space-y-3" noValidate>
        <Input {...register("merchantName")} label="Merchant name" placeholder="Your business name" error={errors.merchantName?.message} />
        <Input {...register("storeName")} label="Store name" placeholder="My Store" error={errors.storeName?.message} />
        <Input {...register("businessType")} label="Business type" placeholder="Retail, Services, etc." error={errors.businessType?.message} />
        <Input {...register("email")} type="email" label="Email" placeholder="merchant@example.com" error={errors.email?.message} />
        <Input {...register("password")} type="password" label="Password" placeholder="Min. 8 characters" error={errors.password?.message} />
        <Input {...register("walletAddress")} label="Wallet address (BSC)" placeholder="0x..." spellCheck={false} error={errors.walletAddress?.message} />
        <Select
          {...register("mode")}
          label="Store mode"
          error={errors.mode?.message}
          options={[
            { value: "marketplace", label: "Marketplace — list products publicly" },
            { value: "payments_only", label: "Payments only — QR / invoice payments" },
          ]}
        />
        <div className="space-y-2">
          <label htmlFor="auth-logo" className="block text-sm font-medium text-muted">
            Logo (optional)
          </label>
          <input
            ref={logoRef}
            id="auth-logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-sm file:text-gold"
          />
        </div>
        {serverError ? <p className="text-sm text-red-400">{serverError}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create merchant account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <button type="button" onClick={onSignIn} className="text-gold hover:text-gold-secondary">
          Sign in
        </button>
      </p>
    </div>
  );
}
