import Link from "next/link";
import { auth } from "@/auth";
import { AtlasGuestGate } from "@/components/atlas/app/AtlasGuestGate";
import { ProfileEditForm } from "@/components/atlas/app/profile/ProfileEditForm";
import {
  getPersonProfileByUserId,
  getNetworkProfileById,
} from "@/modules/atlas-network/repository";
import { ArrowLeft } from "lucide-react";

export default async function ProfileEditPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <AtlasGuestGate
        title="Edit profile"
        description="Sign in to edit your ATLAS profile."
        redirect="/atlas/profile/edit"
      />
    );
  }

  const person = await getPersonProfileByUserId(session.user.id);
  if (!person) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <p className="text-muted">Complete your network profile setup first.</p>
        <Link href="/atlas/profile" className="inline-block mt-4 text-gold hover:underline">
          Go to profile
        </Link>
      </div>
    );
  }

  const profile = await getNetworkProfileById(person.network_profile_id);
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center text-muted">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <Link
        href="/atlas/profile"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Edit profile</h1>
        <p className="text-sm text-muted mt-1">Update your professional identity on ATLAS</p>
      </div>
      <ProfileEditForm profile={profile} person={person} />
    </div>
  );
}
