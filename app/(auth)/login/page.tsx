import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/auth/redirect";
import { CommerceAuthShell } from "@/components/commerce/auth/CommerceAuthShell";
import { privateAreaMetadata } from "@/lib/constants/seo";

export const metadata: Metadata = {
  ...privateAreaMetadata,
  title: "Sign in — ATLAS",
};

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/**
 * ATLAS authentication entry point — Phase 1.
 *
 * Authenticated users are forwarded directly to /dashboard (or the ?redirect
 * destination). Unauthenticated users see the existing CommerceAuthShell modal
 * hosted here so that /marketplace is never involved in authentication.
 *
 * The ?auth=signin param makes CommerceAuthShell open the modal automatically.
 * After a successful login loginAction returns getDashboardPath(role) = /dashboard.
 *
 * NOTE: CommerceAuthShell is a temporary compatibility shim for Phase 1.
 * Phase 2 will replace it with a native ATLAS authentication UI.
 *
 * Classification: Authentication
 */
export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user?.id) {
    const sp = await searchParams;
    const dest = sp.redirect ?? sp.next;
    redirect(dest && dest.startsWith("/") ? dest : getDashboardPath(undefined));
  }

  return (
    // CommerceAuthShell is a Suspense boundary internally; wrap for safety.
    <Suspense>
      <CommerceAuthShell>
        {/* The modal IS the page content — no Marketplace page is rendered. */}
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white">ATLAS Authentication</h1>
            <p className="mt-2 text-muted">Please sign in to continue</p>
          </div>
        </div>
      </CommerceAuthShell>
    </Suspense>
  );
}
