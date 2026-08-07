import { auth } from "@/auth";
import { AtlasGuestGate } from "@/components/atlas/app/AtlasGuestGate";
import {
  getPersonProfileByUserId,
  getNetworkProfileById,
  getNetworkPosts,
} from "@/modules/atlas-network/repository";
import { getProfileView } from "@/modules/atlas-network/repository";
import { ProfileView } from "@/components/atlas/app/profile/ProfileView";

export default async function AtlasProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <AtlasGuestGate
        title="Your profile"
        description="Sign in to view and manage your ATLAS profile."
        redirect="/atlas/profile"
      />
    );
  }

  const person = await getPersonProfileByUserId(session.user.id);
  const profile = person ? await getNetworkProfileById(person.network_profile_id) : null;

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <p className="text-muted">Your network profile is not set up yet.</p>
      </div>
    );
  }

  const [profileView, posts] = await Promise.all([
    getProfileView(profile, profile.id, session.user.id),
    getNetworkPosts({
      authorProfileId: profile.id,
      limit: 20,
      includeComments: true,
      viewerProfileId: profile.id,
    }),
  ]);

  return <ProfileView profile={{ ...profileView, is_owner: true }} initialPosts={posts} />;
}
