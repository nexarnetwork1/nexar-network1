import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { AdminSidebar, AdminHeader } from "@/components/admin/AdminSidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/login?redirect=/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
