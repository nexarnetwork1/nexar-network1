import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { safeRedirect } from "@/lib/auth/redirect";
import { mapAuthJsError } from "@/lib/auth/oauth-errors";
import { AtlasAuthShell } from "@/components/atlas/auth/AtlasAuthShell";
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
    redirect(safeRedirect(dest));
  }

  const initialMode = sp.mode === "register" ? "register" : "signin";
  const authError = mapAuthJsError(sp.error);
  const message = authError ?? sp.message ?? null;

  return (
    <Suspense>
      <AtlasAuthShell>
        <AtlasIdentityPage
          initialMode={initialMode}
          redirect={sp.redirect ?? "/atlas"}
          message={message}
        />
      </AtlasAuthShell>
    </Suspense>
  );
}
