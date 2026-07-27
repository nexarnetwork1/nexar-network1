import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";

export default async function MerchantProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Profile</h1>
      <p className="mt-2 text-muted">Account settings and security preferences.</p>
      <div className="mt-8">
        <ProfileSettingsForm profile={profile} />
      </div>
    </div>
  );
}
