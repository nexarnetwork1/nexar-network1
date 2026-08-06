import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/modules/auth/actions";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Button } from "@/components/ui/Button";
import { DashboardShell } from "@/components/dashboard";
import { ATLAS_BRAND } from "@/config/atlas-branding";
import { atlasNavSections } from "@/config/atlas-nav";
import { privateAreaMetadata } from "@/lib/constants/seo";

export const metadata = {
  ...privateAreaMetadata,
  title: `${ATLAS_BRAND.name} — ${ATLAS_BRAND.tagline}`,
};

export default async function AtlasDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?redirect=/dashboard`);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, profile_completed")
    .eq("id", session.user.id)
    .single();

  if (!profile?.profile_completed) {
    redirect("/auth/complete-profile");
  }

  const role = profile.role as string;
  const sections = atlasNavSections(role);

  return (
    <DashboardShell
      sections={sections}
      brand={ATLAS_BRAND.name}
      brandHref="/dashboard"
      subtitle={ATLAS_BRAND.tagline}
      storageKey="atlas"
      actions={
        <>
          <NotificationBadge userId={profile.id} href="/dashboard" />
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
