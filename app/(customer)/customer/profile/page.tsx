import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getUserNotificationPreferences } from "@/modules/notifications/repository";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";
import { ActiveSessionsSection } from "@/components/profile/ActiveSessionsSection";
import { DashboardCard, DashboardSection } from "@/components/dashboard";

export default async function CustomerProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/customer/profile");
}

  const preferences = await getUserNotificationPreferences(profile.id);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Profile"
        description="Manage your account, security, and wallet."
      />

      <DashboardCard>
        <ProfileSettingsForm profile={profile} />
      </DashboardCard>

      <DashboardSection
        id="notification-settings"
        className="scroll-mt-24"
        title="Notification settings"
        description="Control in-app and email alerts for marketplace activity."
      >
        <NotificationPreferencesForm preferences={preferences} />
      </DashboardSection>

      <DashboardSection
        title="Active sessions"
        description={"Devices where you are signed in. Revoke any you don't recognize."}
      >
        <div className="max-w-lg">
          <ActiveSessionsSection />
        </div>
      </DashboardSection>
    </div>
  );
}
