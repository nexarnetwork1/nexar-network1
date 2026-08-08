import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveAtlasModules } from "@/config/atlas-nav";
import { DashboardSection, DashboardCard, DashboardStats, DashboardStat } from "@/components/dashboard";
import { ATLAS_BRAND } from "@/config/atlas-branding";
import type { UserRole } from "@/types";

/**
 * ATLAS workspace root — the single authenticated entry point.
 *
 * Reads module definitions from ATLAS_ROOT_MODULES (via getActiveAtlasModules).
 * Renders each module as a card linking to its existing real route.
 * No redirects out of /dashboard. URL stays at /dashboard.
 */
export default async function AtlasWorkspacePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?redirect=/dashboard`);
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, profile_completed")
    .eq("id", session.user.id)
    .single();

  if (!profile?.profile_completed) {
    redirect("/auth/complete-profile");
  }

  const role = profile.role as UserRole;
  const isAdmin = role === "admin" || role === "super_admin" || role === "platform_owner";
  const isCustomer = role === "customer";

  // Filter modules to those relevant for this role and that have a navigable href.
  const modules = getActiveAtlasModules().filter((m) => {
    if (!m.href) return false;
    // HQ is admin-only
    if (m.id === "nexar-hq") return isAdmin;
    // Core has no UI
    if (m.id === "core") return false;
    // Customers only see marketplace, wallet, settings
    if (isCustomer) return ["marketplace", "wallet", "settings"].includes(m.id);
    return true;
  });

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title={`${ATLAS_BRAND.name} Workspace`}
        description={`Welcome${profile.full_name ? `, ${profile.full_name}` : ""}. Your business operating system.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((mod) => (
          <DashboardCard key={mod.id} as="div" interactive flush>
            <Link href={mod.href as string} className="block rounded-2xl p-5">
              <p className="font-medium text-white">{mod.label}</p>
              <p className="mt-1 text-sm text-muted line-clamp-2">{mod.description}</p>
            </Link>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
