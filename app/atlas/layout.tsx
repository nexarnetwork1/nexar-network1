import { AtlasAppShell } from "@/components/atlas/app/AtlasAppShell";
import { getActiveBusinesses } from "@/modules/business-hub/repository";
import { getUpcomingEvents } from "@/modules/atlas-network/repository";

export default async function AtlasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [businesses, events] = await Promise.all([
    getActiveBusinesses({ limit: 5 }),
    getUpcomingEvents({ limit: 5 }),
  ]);

  const trendingBusinesses = businesses.map((b) => ({
    id: b.id,
    name: b.display_name,
    slug: b.slug,
    logo_url: b.logo_url,
    industry: b.business_type,
  }));

  return (
    <AtlasAppShell trendingBusinesses={trendingBusinesses} upcomingEvents={events}>
      {children}
    </AtlasAppShell>
  );
}
