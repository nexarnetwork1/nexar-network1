import { requireSuperAdmin } from "@/modules/users/repository";
import { getAllTickerAnnouncementsAdmin } from "@/modules/ticker/repository";
import { TickerManagement } from "@/components/admin/TickerManagement";

export default async function AdminNewsTickerPage() {
  await requireSuperAdmin();
  const announcements = await getAllTickerAnnouncementsAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-yellow-400">News Ticker Management</h1>
        <p className="mt-2 text-zinc-400">
          Manage scrolling announcements shown in the site ticker below the navigation bar.
          Static wallet and platform messages remain unchanged.
        </p>
      </div>

      <TickerManagement initialAnnouncements={announcements} />
    </div>
  );
}
