import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { ActiveSessionsSection } from "@/components/profile/ActiveSessionsSection";
import { DashboardSection } from "@/components/dashboard";

export default async function MerchantProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/profile" }));

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Profile"
        description="Account settings and security preferences."
      />

      <ProfileSettingsForm profile={profile} />

      <DashboardSection
        title="Active sessions"
        level="h2"
        description={<>Devices where you are signed in. Revoke any you don&apos;t recognize.</>}
      >
        <div className="max-w-lg">
          <ActiveSessionsSection />
        </div>
      </DashboardSection>
    </div>
  );
}
