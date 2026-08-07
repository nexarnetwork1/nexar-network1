import { auth } from "@/auth";
import { getPersonProfileByUserId, getNetworkPosts } from "@/modules/atlas-network/repository";
import { SocialFeed } from "@/components/atlas/app/SocialFeed";

export default async function AtlasPage() {
  const session = await auth();
  let viewerProfileId: string | undefined;
  if (session?.user?.id) {
    const person = await getPersonProfileByUserId(session.user.id);
    viewerProfileId = person?.network_profile_id;
  }

  const posts = await getNetworkPosts({
    limit: 20,
    includeComments: true,
    viewerProfileId,
  });

  return <SocialFeed posts={posts} initialHasMore={posts.length >= 20} />;
}
