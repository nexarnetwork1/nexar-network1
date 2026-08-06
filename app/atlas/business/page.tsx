import { auth } from "@/auth";
import { getActiveBusinesses } from "@/modules/business-hub/repository";
import { BusinessDashboard } from "@/components/atlas/app/BusinessDashboard";
import { AtlasGuestGate } from "@/components/atlas/app/AtlasGuestGate";

export default async function AtlasBusinessPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <AtlasGuestGate
        title="Business workspace"
        description="Sign in to access your company dashboard and business tools."
        redirect="/atlas/business"
      />
    );
  }

  const businesses = (await getActiveBusinesses({ limit: 10 })).map((b) => ({
    id: b.id,
    name: b.display_name,
    slug: b.slug,
    logo_url: b.logo_url ?? undefined,
    status: b.status,
  }));
  return <BusinessDashboard businesses={businesses} />;
}
