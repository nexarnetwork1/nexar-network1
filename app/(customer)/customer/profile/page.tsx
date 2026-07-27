import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { ActiveSessionsSection } from "@/components/profile/ActiveSessionsSection";

export default async function CustomerProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Profile</h1>
      <p className="mt-2 text-muted">Manage your account, security, and wallet.</p>
      <div className="mt-8">
        <ProfileSettingsForm profile={profile} />
      </div>
      <section className="mt-12">
        <h2 className="font-heading text-xl font-semibold">Active sessions</h2>
        <p className="mt-1 text-sm text-muted">
          Devices where you are signed in. Revoke any you don&apos;t recognize.
        </p>
        <div className="mt-4 max-w-lg">
          <ActiveSessionsSection />
        </div>
      </section>
    </div>
  );
}
