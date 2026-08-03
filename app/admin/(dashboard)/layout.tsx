import { redirect } from "next/navigation";
import { getSuperAdminSession } from "@/lib/admin/super-admin";
import { AdminHeaderActions } from "@/components/admin/AdminHeaderActions";
import { DashboardShell } from "@/components/dashboard";
import { ADMIN_NAV } from "@/config/dashboard-nav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSuperAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <DashboardShell
      sections={ADMIN_NAV}
      brand="Nexar Admin"
      brandHref="/admin/dashboard"
      subtitle="Platform control"
      storageKey="admin"
      actions={<AdminHeaderActions walletAddress={session.walletAddress} />}
    >
      {children}
    </DashboardShell>
  );
}
