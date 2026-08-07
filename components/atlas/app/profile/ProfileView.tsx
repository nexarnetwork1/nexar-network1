"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { cn } from "@/lib/utils/cn";
import type {
  NetworkFeedPost,
  NetworkProfile,
  NetworkProfileView,
} from "@/modules/atlas-network/types";
import type { PresentedNetworkActivity } from "@/lib/atlas/activity-presenter";
import {
  fetchProfilePostsAction,
  fetchProfileActivityAction,
  fetchProfileConnectionsAction,
  fetchProfileProductsAction,
} from "@/modules/atlas-network/actions";
import { ProfileHeader } from "./ProfileHeader";
import { CompanyProfileView } from "@/components/atlas/app/company/CompanyProfileView";
import { PendingConnectionRequests } from "@/components/atlas/app/network/PendingConnectionRequests";
import { FeedPostCard } from "@/components/atlas/app/feed/FeedPostCard";
import { PostMediaGallery, type FeedMediaItem } from "@/components/atlas/app/feed/PostMediaGallery";
import { MarketplaceListingCard } from "@/components/atlas/marketplace/MarketplaceListingCard";
import { ActivityItem } from "@/components/atlas/activity/ActivityItem";
import { EmptyTab } from "@/components/atlas/ui/EmptyTab";
import type { EnrichedMarketplaceListing } from "@/modules/atlas-marketplace/types";

const TABS = [
  "posts",
  "media",
  "documents",
  "activity",
  "about",
  "connections",
  "companies",
] as const;

type ProfileTab = (typeof TABS)[number];

type ProfileViewProps = {
  profile: NetworkProfileView;
  initialPosts?: NetworkFeedPost[];
  storefrontSlug?: string | null;
  initialEmployeeCount?: number;
  initialIsHiring?: boolean;
  initialOpenJobsCount?: number;
  initialUpcomingEventsCount?: number;
};

function tabLabel(tab: ProfileTab): string {
  const labels: Record<ProfileTab, string> = {
    posts: "Posts",
    media: "Media",
    documents: "Documents",
    activity: "Activity",
    about: "About",
    connections: "Connections",
    companies: "Companies",
  };
  return labels[tab];
}

function ProfileLink({ profile }: { profile: Pick<NetworkProfile, "id" | "slug" | "display_name" | "avatar_url" | "headline"> }) {
  return (
    <Link
      href={`/atlas/network/${profile.slug}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20 transition-colors"
    >
      <div className="h-10 w-10 rounded-full bg-gold/10 overflow-hidden shrink-0">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="font-medium truncate">{profile.display_name}</p>
        {profile.headline && <p className="text-xs text-muted truncate">{profile.headline}</p>}
      </div>
    </Link>
  );
}

export function ProfileView({
  profile,
  initialPosts = [],
  storefrontSlug,
  initialEmployeeCount,
  initialIsHiring,
  initialOpenJobsCount,
  initialUpcomingEventsCount,
}: ProfileViewProps) {
  if (profile.subject_type === "business") {
    return (
      <CompanyProfileView
        profile={profile}
        initialPosts={initialPosts}
        storefrontSlug={storefrontSlug}
        initialEmployeeCount={initialEmployeeCount}
        initialIsHiring={initialIsHiring}
        initialOpenJobsCount={initialOpenJobsCount}
        initialUpcomingEventsCount={initialUpcomingEventsCount}
      />
    );
  }

  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [posts, setPosts] = useState(initialPosts);
  const [activities, setActivities] = useState<PresentedNetworkActivity[]>([]);
  const [connections, setConnections] = useState<
    Array<{ profile?: NetworkProfile | null }>
  >([]);
  const [ownedProducts, setOwnedProducts] = useState<EnrichedMarketplaceListing[]>([]);
  const [loaded, setLoaded] = useState<Partial<Record<ProfileTab, boolean>>>({
    posts: initialPosts.length > 0,
  });
  const [pending, startTransition] = useTransition();

  const sessionActive = !!session?.user;
  const onAuth = useCallback(() => {
    openCommerceAuth({
      mode: "signin",
      redirect: `/atlas/network/${profile.slug}`,
      message: "Sign in to connect on ATLAS",
    });
  }, [openCommerceAuth, profile.slug]);

  useEffect(() => {
    if (loaded[activeTab] || pending) return;
    startTransition(async () => {
      try {
        if (activeTab === "posts" || activeTab === "media" || activeTab === "documents") {
          const [result, productsResult] = await Promise.all([
            fetchProfilePostsAction({ profileId: profile.id, limit: 50 }),
            fetchProfileProductsAction({ profileId: profile.id, limit: 8 }),
          ]);
          setPosts(result.posts);
          setOwnedProducts(productsResult.listings);
        } else if (activeTab === "activity") {
          const result = await fetchProfileActivityAction({ profileId: profile.id });
          setActivities(result.activities);
        } else if (activeTab === "connections" || activeTab === "companies") {
          const result = await fetchProfileConnectionsAction({ profileId: profile.id });
          setConnections(result.connections);
        }
        setLoaded((prev) => ({ ...prev, [activeTab]: true }));
      } catch {
        setLoaded((prev) => ({ ...prev, [activeTab]: true }));
      }
    });
  }, [activeTab, loaded, pending, profile.id]);

  const mediaPosts = posts.filter((p) =>
    (p.media ?? []).some((m) => m.media_type === "image" || m.media_type === "video"),
  );
  const documentPosts = posts.filter((p) =>
    (p.media ?? []).some((m) => m.media_type === "document" || m.media_type === "pdf"),
  );
  const companyConnections = connections.filter((c) => c.profile?.subject_type === "business");

  const profileData = (profile.profile_data ?? {}) as Record<string, unknown>;
  const skills = (profile.person?.skills ?? []) as Array<{ name?: string; level?: string }>;
  const experience = (profile.person?.experience ?? []) as Array<{
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  const education = (profile.person?.education ?? []) as Array<{
    school?: string;
    degree?: string;
    field?: string;
    year?: string;
  }>;
  const certificates = (profile.person?.certificates ?? []) as Array<{
    name?: string;
    issuer?: string;
    year?: string;
  }>;
  const languages = (profileData.languages as string[] | undefined) ?? [];
  const socialLinks =
    (profileData.socialLinks as Array<{ platform: string; url: string }> | undefined) ?? [];

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-4">
      {profile.is_owner && <PendingConnectionRequests />}
      <ProfileHeader profile={profile} session={sessionActive} onAuth={onAuth} />

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-2 text-sm whitespace-nowrap rounded-t-lg transition-colors",
              activeTab === tab
                ? "text-gold border-b-2 border-gold font-medium"
                : "text-muted hover:text-white",
            )}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      <div className={pending && !loaded[activeTab] ? "opacity-60" : ""}>
        {activeTab === "posts" && (
          <div className="space-y-4">
            {ownedProducts.length > 0 && (
              <section>
                <h3 className="font-semibold text-sm mb-3">Products</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ownedProducts.map((listing, index) => (
                    <MarketplaceListingCard key={listing.id} listing={listing} index={index} />
                  ))}
                </div>
              </section>
            )}
            {posts.length === 0 ? (
              <EmptyTab message="No posts yet." />
            ) : (
              posts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  session={sessionActive}
                  onAuth={onAuth}
                  onUpdate={(updated) =>
                    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === "media" && (
          <div className="space-y-4">
            {mediaPosts.length === 0 ? (
              <EmptyTab message="No media shared yet." />
            ) : (
              mediaPosts.map((post) => {
                const items: FeedMediaItem[] = (post.media ?? [])
                  .filter((m) => m.media_type === "image" || m.media_type === "video")
                  .map((m) => ({
                    type: m.media_type as "image" | "video",
                    url: m.media_url,
                    thumbnail_url: (m.metadata?.thumbnail_url as string) ?? undefined,
                    name: (m.metadata?.filename as string) ?? undefined,
                  }));
                return (
                  <div key={post.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <PostMediaGallery media={items} />
                    {post.body && <p className="text-sm text-muted mt-2 line-clamp-2">{post.body}</p>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            {documentPosts.length === 0 ? (
              <EmptyTab message="No documents shared yet." />
            ) : (
              documentPosts.map((post) => (
                <div key={post.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                  {post.title && <p className="font-medium">{post.title}</p>}
                  {(post.media ?? [])
                    .filter((m) => m.media_type === "document" || m.media_type === "pdf")
                    .map((m) => (
                      <a
                        key={m.id}
                        href={m.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-sm text-gold hover:underline"
                      >
                        {(m.metadata?.filename as string) ?? "Document"}
                      </a>
                    ))}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-2">
            {activities.length === 0 ? (
              <EmptyTab message="No recent activity." />
            ) : (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-6">
            {skills.length > 0 && (
              <AboutSection title="Skills">
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm">
                      {s.name}
                      {s.level ? ` · ${s.level}` : ""}
                    </span>
                  ))}
                </div>
              </AboutSection>
            )}
            {experience.length > 0 && (
              <AboutSection title="Experience">
                {experience.map((e, i) => (
                  <div key={i} className="py-2 border-b border-white/5 last:border-0">
                    <p className="font-medium">{e.title}</p>
                    {e.company && <p className="text-sm text-muted">{e.company}</p>}
                    {(e.startDate || e.endDate) && (
                      <p className="text-xs text-muted">
                        {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
                      </p>
                    )}
                    {e.description && <p className="text-sm mt-1">{e.description}</p>}
                  </div>
                ))}
              </AboutSection>
            )}
            {education.length > 0 && (
              <AboutSection title="Education">
                {education.map((e, i) => (
                  <div key={i} className="py-2">
                    <p className="font-medium">{e.school}</p>
                    <p className="text-sm text-muted">
                      {[e.degree, e.field, e.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </AboutSection>
            )}
            {certificates.length > 0 && (
              <AboutSection title="Certificates">
                {certificates.map((c, i) => (
                  <div key={i} className="py-2">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted">
                      {[c.issuer, c.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </AboutSection>
            )}
            {languages.length > 0 && (
              <AboutSection title="Languages">
                <p className="text-sm">{languages.join(", ")}</p>
              </AboutSection>
            )}
            {socialLinks.length > 0 && (
              <AboutSection title="Social Links">
                <div className="space-y-1">
                  {socialLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-gold hover:underline"
                    >
                      {link.platform}
                    </a>
                  ))}
                </div>
              </AboutSection>
            )}
            {skills.length === 0 &&
              experience.length === 0 &&
              education.length === 0 &&
              certificates.length === 0 &&
              languages.length === 0 &&
              socialLinks.length === 0 &&
              !profile.bio && <EmptyTab message="No about information yet." />}
          </div>
        )}

        {activeTab === "connections" && (
          <div className="grid sm:grid-cols-2 gap-3">
            {connections.filter((c) => c.profile?.subject_type === "user").length === 0 ? (
              <EmptyTab message="No connections yet." />
            ) : (
              connections
                .filter((c) => c.profile?.subject_type === "user")
                .map((c) => c.profile && <ProfileLink key={c.profile.id} profile={c.profile} />)
            )}
          </div>
        )}

        {activeTab === "companies" && (
          <div className="grid sm:grid-cols-2 gap-3">
            {companyConnections.length === 0 ? (
              <EmptyTab message="No company connections yet." />
            ) : (
              companyConnections.map(
                (c) => c.profile && <ProfileLink key={c.profile.id} profile={c.profile} />,
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AboutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="p-4 rounded-xl border border-white/10 bg-white/5">{children}</div>
    </section>
  );
}
