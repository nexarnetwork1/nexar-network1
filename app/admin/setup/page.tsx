import { redirect } from "next/navigation";
import { getBootstrapState } from "@/modules/atlas-hq/repository";
import { PlatformOwnerSetupForm } from "./PlatformOwnerSetupForm";
import { Logo } from "@/components/ui/Logo";
import { ATLAS_PORTAL_SUBTITLES } from "@/config/atlas-branding";

/**
 * First-installation Platform Owner Wizard.
 * Creates Platform Owner with bcrypt-hashed password — no hardcoded secrets.
 */
export default async function AdminSetupPage() {
  const state = await getBootstrapState().catch(() => null);
  if (state?.completed) {
    redirect("/admin/login");
  }

  return (
    <main className="animate-atlas-fade-in flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <Logo priority height={52} />
      <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-gold/80 uppercase">
        {ATLAS_PORTAL_SUBTITLES.admin} · First installation
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold text-white">
        Platform Owner Wizard
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Create the permanent Platform Owner for NEXAR HQ. The password is hashed with bcrypt and
        never stored in plain text. After first login you must change the password and enable 2FA.
      </p>
      <div className="mt-8 w-full max-w-md text-left">
        <PlatformOwnerSetupForm />
      </div>
    </main>
  );
}
