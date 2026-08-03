import { requireSuperAdmin } from "@/modules/users/repository";
import { getAllTickerAnnouncementsAdmin } from "@/modules/ticker/repository";
import { TickerManagement } from "@/components/admin/TickerManagement";
import { DashboardSection } from "@/components/dashboard";

export default async function AdminNewsTickerPage() {
  await requireSuperAdmin();
  const announcements = await getAllTickerAnnouncementsAdmin();

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="News ticker management"
        headingClassName="text-gold"
        description="Manage scrolling announcements shown in the site ticker below the navigation bar. Static wallet and platform messages remain unchanged."
      />

      <TickerManagement initialAnnouncements={announcements} />
    </div>
  );
}
