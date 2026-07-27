import { redirect } from "next/navigation";
import { getSuperAdminSession } from "@/lib/admin/super-admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSuperAdminSession();

  if (!session) {
    redirect("/?admin=wallet-required");
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader walletAddress={session.walletAddress} />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
