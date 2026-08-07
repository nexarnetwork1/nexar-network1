import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getNetworkProfileBySlug,
  getNetworkPosts,
  getPersonProfileByUserId,
  getProfileView,
  getCompanyAnalyticsSummary,
  countOpenJobsForBusiness,
  businessIsHiring,
  getEventsByNetworkProfileId,
} from "@/modules/atlas-network/repository";
import { ProfileView } from "@/components/atlas/app/profile/ProfileView";
import { getBusinessById, listBusinessMembers } from "@/modules/business-hub/repository";
import { getStorefrontByBusinessId } from "@/modules/atlas-marketplace/repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NetworkProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getNetworkProfileBySlug(slug);
  if (!profile || profile.deleted_at) notFound();

  const session = await auth();
  let viewerProfileId: string | undefined;
  if (session?.user?.id) {
    const person = await getPersonProfileByUserId(session.user.id);
    viewerProfileId = person?.network_profile_id;
  }

  const isCompany = profile.subject_type === "business" && profile.business_id;

  const [profileView, posts, business, storefront, members, openJobsCount, isHiring, upcomingEvents] =
    await Promise.all([
    getProfileView(profile, viewerProfileId, session?.user?.id),
    getNetworkPosts({
      authorProfileId: profile.id,
      businessId: isCompany ? profile.business_id! : undefined,
      limit: 20,
      includeComments: true,
      viewerProfileId,
    }),
    isCompany ? getBusinessById(profile.business_id!) : Promise.resolve(null),
    isCompany ? getStorefrontByBusinessId(profile.business_id!) : Promise.resolve(null),
    isCompany ? listBusinessMembers(profile.business_id!) : Promise.resolve([]),
    isCompany ? countOpenJobsForBusiness(profile.business_id!) : Promise.resolve(0),
    isCompany ? businessIsHiring(profile.business_id!) : Promise.resolve(false),
    isCompany
      ? getEventsByNetworkProfileId({
          networkProfileId: profile.id,
          upcoming: true,
          limit: 20,
        })
      : Promise.resolve([]),
  ]);

  let enrichedProfile = profileView;
  if (isCompany && business) {
    const analytics = await getCompanyAnalyticsSummary({
      businessId: business.id,
      networkProfileId: profile.id,
      followerCount: profile.follower_count,
      employeeCount: members.length,
    });
    enrichedProfile = {
      ...profileView,
      business,
      analytics,
    };
  }

  if (
    enrichedProfile.privacy !== "public" &&
    !enrichedProfile.is_owner &&
    !enrichedProfile.is_following &&
    enrichedProfile.connection_status !== "accepted"
  ) {
    notFound();
  }

  return (
    <ProfileView
      profile={enrichedProfile}
      initialPosts={posts}
      storefrontSlug={storefront?.slug ?? business?.slug ?? null}
      initialEmployeeCount={members.length}
      initialIsHiring={isHiring}
      initialOpenJobsCount={openJobsCount}
      initialUpcomingEventsCount={upcomingEvents.length}
    />
  );
}
