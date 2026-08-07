import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/auth/redirect";
import { CommerceAuthShell } from "@/components/commerce/auth/CommerceAuthShell";
import { AtlasIdentityPage } from "@/components/atlas/identity/AtlasIdentityModal";
import { privateAreaMetadata } from "@/lib/constants/seo";

export const metadata: Metadata = {
  ...privateAreaMetadata,
  title: "Sign in — ATLAS",
};

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;

  if (session?.user?.id) {
    const dest = sp.redirect ?? sp.next;
    redirect(dest && dest.startsWith("/") ? dest : getDashboardPath(undefined));
  }

  const initialMode = sp.mode === "register" ? "register" : "signin";

  return (
    <Suspense>
      <CommerceAuthShell>
        <AtlasIdentityPage
          initialMode={initialMode}
          redirect={sp.redirect ?? null}
          message={sp.message ?? null}
        />
      </CommerceAuthShell>
    </Suspense>
  );
}
