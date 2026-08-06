import { redirect } from "next/navigation";
import Link from "next/link";
import { getBootstrapState } from "@/modules/atlas-hq/repository";
import { auth } from "@/auth";
import { hasHqAuthority } from "@/lib/hq/authorization";
import { Logo } from "@/components/ui/Logo";
import { ATLAS_BRAND, ATLAS_PORTAL_SUBTITLES } from "@/config/atlas-branding";

/**
 * NEXAR HQ entry — ATLAS Auth.js login (wallet Super Admin removed).
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const bootstrap = await getBootstrapState().catch(() => null);

  if (!bootstrap?.completed) {
    redirect("/admin/setup");
  }

  const session = await auth();
  if (session?.user?.id && (await hasHqAuthority())) {
    redirect(params.redirect && params.redirect.startsWith("/") ? params.redirect : "/admin/dashboard");
  }

  const redirectTo = encodeURIComponent(params.redirect ?? "/admin/dashboard");

  return (
    <main className="animate-atlas-fade-in flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo priority />
      <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-gold/80 uppercase">
        {ATLAS_PORTAL_SUBTITLES.admin}
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold text-white">
        Platform administration
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Sign in with your {ATLAS_BRAND.name} account. Access is limited to the Platform Owner and
        assigned {ATLAS_PORTAL_SUBTITLES.admin} team members.
      </p>
      <Link
        href={`/login?redirect=${redirectTo}`}
        className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--nxr-radius-button)] bg-gold px-6 text-sm font-semibold tracking-[0.04em] text-background uppercase transition hover:bg-gold-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Sign in to {ATLAS_BRAND.name}
      </Link>
    </main>
  );
}
