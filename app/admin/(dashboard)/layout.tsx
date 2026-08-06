import { redirect } from "next/navigation";
import { requireHqAccessOrRedirect } from "@/lib/hq/authorization";
import { AdminHeaderActions } from "@/components/admin/AdminHeaderActions";
import { ATLAS_BRAND, ATLAS_PORTAL_SUBTITLES } from "@/config/atlas-branding";
import { DashboardShell } from "@/components/dashboard";
import { ADMIN_NAV } from "@/config/dashboard-nav";
import { getBootstrapState } from "@/modules/atlas-hq/repository";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bootstrap = await getBootstrapState().catch(() => null);
  if (!bootstrap?.completed) {
    redirect("/admin/setup");
  }

  const hq = await requireHqAccessOrRedirect({ permission: "hq:access" });

  if (hq.mustChangePassword) {
    redirect("/auth/change-password?hq=1");
  }
  if (hq.mustEnable2fa) {
    redirect("/auth/enable-2fa?hq=1");
  }

  return (
    <DashboardShell
      sections={ADMIN_NAV}
      brand={`${ATLAS_BRAND.name} · NEXAR HQ`}
      brandHref="/admin/dashboard"
      subtitle={ATLAS_PORTAL_SUBTITLES.admin}
      storageKey="admin"
      actions={
        <AdminHeaderActions
          label={hq.isPlatformOwner ? "Platform Owner" : "NEXAR HQ"}
          email={undefined}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
