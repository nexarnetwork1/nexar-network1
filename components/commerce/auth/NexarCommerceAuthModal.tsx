"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Store, UserRound, Wallet, X } from "lucide-react";
import { signIn } from "next-auth/react";
import { usePrivy } from "@privy-io/react-auth";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { markWalletSessionActive } from "@/lib/web3/wallet-session";
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
  linkOrLoginWalletAction,
} from "@/modules/auth/actions";
import { objectToFormData } from "@/utils/form-data";
import { cn } from "@/lib/utils/cn";

type CommerceAuthMode = "signin" | "register";

type CommerceAuthRole = "customer" | "merchant";

type NexarCommerceAuthModalProps = {
  open: boolean;
  mode: CommerceAuthMode;
  role: CommerceAuthRole;
  redirect: string | null;
  message: string | null;
  onClose: () => void;
  onModeChange: (mode: CommerceAuthMode) => void;
  onRoleChange: (role: CommerceAuthRole) => void;
  onSuccess: (destination: string) => void;
};

function Field({
  label,
  error,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
        {label}
      </span>
      <input
        id={id}
        className={cn(
          "w-full rounded-xl border bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors",
          "placeholder:text-muted/60 focus:border-gold/40 focus:ring-2 focus:ring-gold/15",
          error ? "border-red-500/50" : "border-border/70",
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  error,
  id,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
        {label}
      </span>
      <select
        id={id}
        className={cn(
          "w-full rounded-xl border bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors",
          "focus:border-gold/40 focus:ring-2 focus:ring-gold/15",
          error ? "border-red-500/50" : "border-border/70",
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface">
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
      <span className="text-[10px] tracking-[0.2em] text-muted uppercase">or continue with</span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
    </div>
  );
}

function GoogleConnect({
  redirectTo,
  intent,
}: {
  redirectTo?: string;
  intent?: CommerceAuthRole;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  async function handleGoogle() {
    if (startedRef.current || loading) return;
    startedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const appUrl = (
        process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      ).replace(/\/$/, "");
      const callbackUrl = `${appUrl}/auth/callback${
        redirectTo || intent
          ? `?${new URLSearchParams({
              ...(redirectTo ? { redirect: redirectTo } : {}),
              ...(intent ? { intent } : {}),
            }).toString()}`
          : ""
      }`;

      await signIn("google", { callbackUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      startedRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        disabled={loading}
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-black/40 px-4 py-3 text-sm font-medium text-white transition-all hover:border-gold/30 hover:bg-gold/5 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Google
      </button>
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function WalletConnect() {
  const { login, ready, authenticated, user } = usePrivy();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWallet() {
    if (!isWeb3Configured()) {
      setError("Wallet provider is not configured.");
      return;
    }
    if (!ready || connecting) return;

    setConnecting(true);
    setError(null);
    try {
      if (!authenticated) {
        await login();
      }
      markWalletSessionActive();
      const address =
        user?.wallet?.address ??
        (window as unknown as { ethereum?: { selectedAddress?: string } }).ethereum
          ?.selectedAddress;
      if (address) {
        const result = await linkOrLoginWalletAction(address);
        if (!result.success) {
          setError(result.error ?? "Wallet link failed");
        } else if (result.redirectTo) {
          window.location.href = result.redirectTo;
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    } finally {
      setConnecting(false);
    }
  }

  const label = authenticated ? "Connected" : connecting ? "Connecting…" : "Wallet";

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        disabled={!isWeb3Configured() || !ready || connecting}
        onClick={handleWallet}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm font-medium text-gold transition-all hover:border-gold/40 hover:bg-gold/10 disabled:opacity-60"
      >
        {connecting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Wallet className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {label}
      </button>
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function AlternateAuth({
  redirectTo,
  intent,
}: {
  redirectTo?: string;
  intent?: CommerceAuthRole;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <GoogleConnect redirectTo={redirectTo} intent={intent} />
      <WalletConnect />
    </div>
  );
}

function SignInView({
  redirect,
  message,
  onSuccess,
  onSwitchRegister,
}: {
  redirect: string | null;
  message: string | null;
  onSuccess: (destination: string) => void;
  onSwitchRegister: () => void;
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
    const rememberMe = (document.getElementById("nxr-commerce-remember") as HTMLInputElement)
      ?.checked;
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
    <motion.div
      key="signin-view"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.22 }}
      className="space-y-5"
    >
      {message === "confirm_email" ? (
        <p className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-gold-secondary">
          Confirm your email, then sign in to continue.
        </p>
      ) : null}
      {message === "password_reset" ? (
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400">
          Password updated successfully. Sign in with your new password.
        </p>
      ) : null}
      {message === "auth_callback_failed" ? (
        <p className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs text-red-400">
          Google sign-in could not be completed. Try again or use email and password.
        </p>
      ) : null}

      <AlternateAuth redirectTo={redirect ?? undefined} />
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          id="nxr-commerce-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          id="nxr-commerce-password"
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
              id="nxr-commerce-remember"
              type="checkbox"
              className="rounded border-border bg-black/50 accent-gold"
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold px-4 py-3.5 text-sm font-semibold tracking-wide text-background shadow-[0_0_30px_-10px_rgba(212,175,55,0.55)] transition-all hover:bg-gold-secondary disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Signing in…" : "Sign in to ATLAS"}
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

function CustomerRegisterView({
  redirect,
  onSuccess,
  onSwitchSignIn,
}: {
  redirect: string | null;
  onSuccess: (destination: string) => void;
  onSwitchSignIn: () => void;
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
    <motion.div
      key="customer-register"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22 }}
      className="space-y-4"
    >
      <AlternateAuth intent="customer" redirectTo={redirect ?? "/marketplace"} />
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          id="nxr-customer-name"
          label="Full name"
          placeholder="John Doe"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Field
          id="nxr-customer-email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          id="nxr-customer-password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Field
          id="nxr-customer-wallet"
          label="Wallet (BSC)"
          placeholder="0x…"
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold px-4 py-3.5 text-sm font-semibold text-background hover:bg-gold-secondary disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-center text-xs text-muted">
        Already registered?{" "}
        <button type="button" onClick={onSwitchSignIn} className="text-gold hover:underline">
          Sign in
        </button>
      </p>
    </motion.div>
  );
}

function MerchantRegisterView({
  onSuccess,
  onSwitchSignIn,
}: {
  onSuccess: (destination: string) => void;
  onSwitchSignIn: () => void;
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

  return (
    <motion.div
      key="merchant-register"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22 }}
      className="space-y-4"
    >
      <AlternateAuth intent="merchant" redirectTo="/merchant/onboarding" />
      <Divider />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)(e);
        }}
        className="space-y-4"
        noValidate
      >
        <Field
          id="nxr-merchant-name"
          label="Merchant name"
          placeholder="Your business name"
          error={errors.merchantName?.message}
          {...register("merchantName")}
        />
        <Field
          id="nxr-store-name"
          label="Store name"
          placeholder="My Store"
          error={errors.storeName?.message}
          {...register("storeName")}
        />
        <Field
          id="nxr-business-type"
          label="Business type"
          placeholder="Retail, services…"
          error={errors.businessType?.message}
          {...register("businessType")}
        />
        <Field
          id="nxr-merchant-email"
          label="Email"
          type="email"
          placeholder="merchant@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          id="nxr-merchant-password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Field
          id="nxr-merchant-wallet"
          label="Wallet (BSC)"
          placeholder="0x…"
          spellCheck={false}
          error={errors.walletAddress?.message}
          {...register("walletAddress")}
        />
        <SelectField
          id="nxr-store-mode"
          label="Store mode"
          error={errors.mode?.message}
          options={[
            { value: "marketplace", label: "Marketplace — public catalog" },
            { value: "payments_only", label: "Payments only — QR & invoices" },
          ]}
          {...register("mode")}
        />
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
            Logo (optional)
          </span>
          <input
            ref={logoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full rounded-xl border border-border/70 bg-black/40 px-3 py-2.5 text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-gold/10 file:px-3 file:py-1.5 file:text-gold"
          />
        </div>
        {serverError ? (
          <p className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {serverError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold px-4 py-3.5 text-sm font-semibold text-background hover:bg-gold-secondary disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Creating business…" : "Create business account"}
        </button>
      </form>
      <p className="text-center text-xs text-muted">
        Already registered?{" "}
        <button type="button" onClick={onSwitchSignIn} className="text-gold hover:underline">
          Sign in
        </button>
      </p>
    </motion.div>
  );
}

export function NexarCommerceAuthModal({
  open,
  mode,
  role,
  redirect,
  message,
  onClose,
  onModeChange,
  onRoleChange,
  onSuccess,
}: NexarCommerceAuthModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-0 bottom-0 top-[var(--nxr-header-offset)] z-[130] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
          onClick={onClose}
        >
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nxr-commerce-auth-title"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex max-h-[min(720px,calc(100dvh-var(--nxr-header-offset)-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-gold/20 bg-[#070708]/90 shadow-[0_0_100px_-20px_rgba(212,175,55,0.5)] backdrop-blur-2xl"
          data-scroll-lock-scrollable
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          <button
            type="button"
            aria-label="Close authentication"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-black/60 text-muted transition-colors hover:border-gold/35 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>

          <div className="overflow-y-auto px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
            <header className="mb-6 text-center">
              <p className="text-[10px] tracking-[0.28em] text-gold/80 uppercase">ATLAS</p>
              <h2
                id="nxr-commerce-auth-title"
                className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white"
              >
                {mode === "signin" ? "Welcome back" : "Join ATLAS"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {mode === "signin"
                  ? "Access your ATLAS workspace. Manage your business, network, marketplace, payments, and services from one place."
                  : "Create your account to access the complete business operating system."}
              </p>
            </header>

            <div className="mb-6 flex rounded-full border border-border/60 bg-black/40 p-1">
              {(["signin", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onModeChange(tab)}
                  className={cn(
                    "flex-1 rounded-full py-2.5 text-xs font-semibold tracking-wide transition-all",
                    mode === tab
                      ? "bg-gold/15 text-gold shadow-[inset_0_0_0_1px_rgba(212,175,55,0.35)]"
                      : "text-muted hover:text-white",
                  )}
                >
                  {tab === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {mode === "signin" ? (
                <SignInView
                  redirect={redirect}
                  message={message}
                  onSuccess={onSuccess}
                  onSwitchRegister={() => onModeChange("register")}
                />
              ) : (
                <motion.div
                  key="register-shell"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-5 grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "customer" as const, label: "Customer", icon: UserRound },
                        { id: "merchant" as const, label: "Merchant", icon: Store },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onRoleChange(id)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition-all",
                          role === id
                            ? "border-gold/40 bg-gold/10 text-gold"
                            : "border-border/60 bg-black/30 text-muted hover:border-gold/20 hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        {label}
                      </button>
                    ))}
                  </div>

                  {role === "customer" ? (
                    <CustomerRegisterView
                      redirect={redirect}
                      onSuccess={onSuccess}
                      onSwitchSignIn={() => onModeChange("signin")}
                    />
                  ) : (
                    <MerchantRegisterView
                      onSuccess={onSuccess}
                      onSwitchSignIn={() => onModeChange("signin")}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
