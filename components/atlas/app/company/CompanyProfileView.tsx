"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { cn } from "@/lib/utils/cn";
import {
  Briefcase,
  Calendar,
  Package,
  BarChart3,
  Users,
  Wrench,
  FileText,
} from "lucide-react";
import type {
  NetworkEvent,
  NetworkFeedPost,
  NetworkProfileView,
} from "@/modules/atlas-network/types";
import type { EnrichedMarketplaceListing } from "@/modules/atlas-marketplace/types";
import type { MarketplaceStorefront } from "@/modules/atlas-marketplace/types";
import type { BusinessMemberWithProfile } from "@/modules/business-hub/repository";
import {
  fetchProfilePostsAction,
  fetchCompanyEmployeesAction,
  fetchCompanyProductsAction,
  fetchCompanyServicesAction,
  fetchCompanyEventsAction,
  fetchCompanyJobsAction,
  fetchCompanyStorefrontAction,
  fetchCompanyActivityAction,
} from "@/modules/atlas-network/actions";
import { CompanyProfileHeader } from "./CompanyProfileHeader";
import { FeedPostCard } from "@/components/atlas/app/feed/FeedPostCard";
import { JobCard } from "@/components/atlas/jobs/JobCard";
import { EventCard } from "@/components/atlas/events/EventCard";
import { MarketplaceListingCard } from "@/components/atlas/marketplace/MarketplaceListingCard";
import { ActivityItem } from "@/components/atlas/activity/ActivityItem";
import { EmptyTab } from "@/components/atlas/ui/EmptyTab";
import type { PresentedNetworkActivity } from "@/lib/atlas/activity-presenter";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

const COMPANY_TABS = [
  "posts",
  "activity",
  "products",
  "services",
  "events",
  "jobs",
  "team",
  "about",
  "analytics",
] as const;

type CompanyTab = (typeof COMPANY_TABS)[number];

type CompanyProfileViewProps = {
  profile: NetworkProfileView;
  initialPosts?: NetworkFeedPost[];
  storefrontSlug?: string | null;
  initialEmployeeCount?: number;
  initialIsHiring?: boolean;
  initialOpenJobsCount?: number;
  initialUpcomingEventsCount?: number;
};

function tabLabel(tab: CompanyTab): string {
  const labels: Record<CompanyTab, string> = {
    posts: "Posts",
    activity: "Activity",
    products: "Products",
    services: "Services",
    events: "Events",
    jobs: "Jobs",
    team: "Team",
    about: "About",
    analytics: "Analytics",
  };
  return labels[tab];
}

function roleLabel(role: string): string {
  if (role === "staff" || role === "viewer") return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function CompanyProfileView({
  profile,
  initialPosts = [],
  storefrontSlug,
  initialEmployeeCount = 0,
  initialIsHiring = false,
  initialOpenJobsCount = 0,
  initialUpcomingEventsCount = 0,
}: CompanyProfileViewProps) {
  const businessId = profile.business_id;
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const [activeTab, setActiveTab] = useState<CompanyTab>("posts");
  const [posts, setPosts] = useState(initialPosts);
  const [products, setProducts] = useState<EnrichedMarketplaceListing[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<EnrichedMarketplaceListing[]>([]);
  const [topProducts, setTopProducts] = useState<EnrichedMarketplaceListing[]>([]);
  const [serviceListings, setServiceListings] = useState<EnrichedMarketplaceListing[]>([]);
  const [storefront, setStorefront] = useState<MarketplaceStorefront | null>(null);
  const [servicePosts, setServicePosts] = useState<NetworkFeedPost[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<NetworkEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<NetworkEvent[]>([]);
  const [jobs, setJobs] = useState<NetworkFeedPost[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<NetworkFeedPost[]>([]);
  const [openJobsCount, setOpenJobsCount] = useState(initialOpenJobsCount);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(initialUpcomingEventsCount);
  const [isHiring, setIsHiring] = useState(initialIsHiring);
  const [members, setMembers] = useState<BusinessMemberWithProfile[]>([]);
  const [activities, setActivities] = useState<PresentedNetworkActivity[]>([]);
  const [employeeCount, setEmployeeCount] = useState(initialEmployeeCount);
  const [loaded, setLoaded] = useState<Partial<Record<CompanyTab, boolean>>>({
    posts: initialPosts.length > 0,
  });
  const [pending, startTransition] = useTransition();

  const sessionActive = !!session?.user;
  const onAuth = useCallback(() => {
    openCommerceAuth({
      mode: "signin",
      redirect: `/atlas/network/${profile.slug}`,
      message: "Sign in to follow this company on ATLAS",
    });
  }, [openCommerceAuth, profile.slug]);

  useEffect(() => {
    if (!businessId || loaded[activeTab] || pending) return;
    startTransition(async () => {
      try {
        if (activeTab === "posts") {
          const result = await fetchProfilePostsAction({ profileId: profile.id, limit: 50 });
          setPosts(result.posts);
        } else if (activeTab === "products") {
          const [latest, featured, top, storeResult] = await Promise.all([
            fetchCompanyProductsAction({ businessId, filter: "latest" }),
            fetchCompanyProductsAction({ businessId, filter: "featured" }),
            fetchCompanyProductsAction({ businessId, filter: "top" }),
            fetchCompanyStorefrontAction({ businessId }),
          ]);
          setProducts(latest.listings);
          setFeaturedProducts(featured.listings);
          setTopProducts(top.listings);
          setStorefront(storeResult.storefront);
        } else if (activeTab === "services") {
          const result = await fetchCompanyServicesAction({ businessId });
          setServiceListings(result.listings);
          setServicePosts(result.posts);
        } else if (activeTab === "events") {
          const [upcoming, past] = await Promise.all([
            fetchCompanyEventsAction({ networkProfileId: profile.id, upcoming: true }),
            fetchCompanyEventsAction({ networkProfileId: profile.id, upcoming: false }),
          ]);
          setUpcomingEvents(upcoming.events);
          setPastEvents(past.events);
          setUpcomingEventsCount(upcoming.events.length);
        } else if (activeTab === "jobs") {
          const [open, featured] = await Promise.all([
            fetchCompanyJobsAction({ businessId, filter: "open" }),
            fetchCompanyJobsAction({ businessId, filter: "featured" }),
          ]);
          setJobs(open.jobs);
          setFeaturedJobs(featured.jobs);
          setOpenJobsCount(open.jobs.length);
          setIsHiring(open.jobs.length > 0);
        } else if (activeTab === "team") {
          const result = await fetchCompanyEmployeesAction({ businessId });
          setMembers(result.members);
          setEmployeeCount(result.members.length);
        } else if (activeTab === "activity") {
          const result = await fetchCompanyActivityAction({ businessId });
          setActivities(result.activities);
        }
        setLoaded((prev) => ({ ...prev, [activeTab]: true }));
      } catch {
        setLoaded((prev) => ({ ...prev, [activeTab]: true }));
      }
    });
  }, [activeTab, loaded, pending, profile.id, businessId]);

  const business = profile.business;
  const company = profile.company;
  const bizProfile = business?.profile ?? {};
  const showcase = (company?.showcase ?? {}) as Record<string, unknown>;
  const analytics = profile.analytics;

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-4">
      <CompanyProfileHeader
        profile={profile}
        session={sessionActive}
        onAuth={onAuth}
        employeeCount={employeeCount}
        storefrontSlug={storefrontSlug}
        isHiring={isHiring}
        openJobsCount={openJobsCount}
        upcomingEventsCount={upcomingEventsCount}
      />

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide border-b border-white/10">
        {COMPANY_TABS.map((tab) => (
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
            {posts.length === 0 ? (
              <EmptyTab message="No company posts yet." />
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

        {activeTab === "activity" && (
          <div className="space-y-2">
            {activities.length === 0 ? (
              <EmptyTab message="No company activity yet." />
            ) : (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-6">
            {storefront && (
              <StoreInfoSection storefront={storefront} companySlug={profile.slug} />
            )}
            {featuredProducts.length > 0 && (
              <ProductSection title="Featured Products" listings={featuredProducts} />
            )}
            {topProducts.length > 0 && (
              <ProductSection title="Top Selling" listings={topProducts.slice(0, 8)} />
            )}
            <ProductSection
              title="Latest Products"
              listings={products}
              emptyMessage="No products listed yet."
            />
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-6">
            {serviceListings.length > 0 && (
              <ProductSection title="Service Listings" listings={serviceListings} />
            )}
            {servicePosts.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Service Posts</h3>
                {servicePosts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    session={sessionActive}
                    onAuth={onAuth}
                    onUpdate={(updated) =>
                      setServicePosts((prev) =>
                        prev.map((p) => (p.id === updated.id ? updated : p)),
                      )
                    }
                  />
                ))}
              </div>
            ) : serviceListings.length === 0 ? (
              <EmptyTab message="No services listed yet." />
            ) : null}
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-6">
            {upcomingEvents.length > 0 && (
              <section>
                <h3 className="font-semibold text-sm mb-3">Upcoming Events</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} compact />
                  ))}
                </div>
              </section>
            )}
            <EventSection title="Past Events" events={pastEvents} past />
            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <EmptyTab message="No events yet." />
            )}
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-6">
            {featuredJobs.length > 0 && (
              <section>
                <h3 className="font-semibold text-sm mb-3">Featured Roles</h3>
                <div className="space-y-3">
                  {featuredJobs.map((job) => (
                    <JobCard key={job.id} job={job} compact />
                  ))}
                </div>
              </section>
            )}
            <section>
              <h3 className="font-semibold text-sm mb-3">Open Positions</h3>
              {jobs.length === 0 ? (
                <EmptyTab message="No open positions." />
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} compact />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "team" && (
          <div className="grid sm:grid-cols-2 gap-3">
            {members.length === 0 ? (
              <EmptyTab message="No team members listed." />
            ) : (
              members.map((member) => {
                const inner = (
                  <>
                    <div className="h-10 w-10 rounded-full bg-gold/10 overflow-hidden shrink-0">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-gold/30 m-auto mt-2.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{member.display_name}</p>
                      <p className="text-xs text-gold capitalize">{roleLabel(member.role)}</p>
                      {member.headline && (
                        <p className="text-xs text-muted truncate">{member.headline}</p>
                      )}
                    </div>
                  </>
                );
                return member.network_slug ? (
                  <Link
                    key={member.id}
                    href={`/atlas/network/${member.network_slug}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
                  >
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-6">
            {(profile.bio || (bizProfile.description as string | undefined)) && (
              <AboutBlock title="Description">
                <p className="text-sm whitespace-pre-wrap">
                  {profile.bio ?? (bizProfile.description as string)}
                </p>
              </AboutBlock>
            )}
            {company?.industry && (
              <AboutBlock title="Industry">
                <p className="text-sm">{company.industry}</p>
              </AboutBlock>
            )}
            {Object.keys(showcase).length > 0 && (
              <AboutBlock title="Showcase">
                <ShowcaseDetails showcase={showcase} />
              </AboutBlock>
            )}
            {!profile.bio &&
              !bizProfile.description &&
              !company?.industry &&
              Object.keys(showcase).length === 0 && (
                <EmptyTab message="No company information yet." />
              )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {analytics ? (
              <>
                <StatCard label="Followers" value={analytics.followers} icon={Users} />
                <StatCard label="Employees" value={analytics.employees} icon={Users} />
                <StatCard label="Products" value={analytics.products} icon={Package} />
                <StatCard label="Services" value={analytics.services} icon={Wrench} />
                <StatCard label="Orders" value={analytics.orders} icon={BarChart3} />
                <StatCard label="Posts" value={analytics.posts} icon={FileText} />
                <StatCard label="Engagement" value={analytics.engagement} icon={BarChart3} />
                <StatCard label="Views" value={analytics.views} icon={BarChart3} />
              </>
            ) : (
              <EmptyTab message="Analytics not available." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductSection({
  title,
  listings,
  emptyMessage,
}: {
  title: string;
  listings: EnrichedMarketplaceListing[];
  emptyMessage?: string;
}) {
  if (listings.length === 0) {
    return emptyMessage ? <EmptyTab message={emptyMessage} /> : null;
  }
  return (
    <section>
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {listings.map((listing, index) => (
          <MarketplaceListingCard key={listing.id} listing={listing} index={index} />
        ))}
      </div>
    </section>
  );
}

function StoreInfoSection({
  storefront,
  companySlug,
}: {
  storefront: MarketplaceStorefront;
  companySlug: string;
}) {
  return (
    <section className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{storefront.display_name}</h3>
          {storefront.tagline && (
            <p className="text-sm text-muted mt-1">{storefront.tagline}</p>
          )}
        </div>
        <Link
          href={MARKETPLACE_ROUTES.store(storefront.slug)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/30 text-gold text-sm hover:bg-gold/10"
        >
          Visit store
        </Link>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-muted">
        <span>
          <strong className="text-white">{storefront.listing_count}</strong> listings
        </span>
        <span>
          <strong className="text-white">{storefront.follower_count}</strong> store followers
        </span>
        <Link href={`/atlas/network/${companySlug}`} className="text-gold hover:underline">
          Company profile
        </Link>
      </div>
    </section>
  );
}

function EventSection({
  title,
  events,
  past,
}: {
  title: string;
  events: NetworkEvent[];
  past?: boolean;
}) {
  if (events.length === 0) {
    return (
      <section>
        <h3 className="font-semibold mb-2 text-sm">{title}</h3>
        <p className="text-sm text-muted">No {past ? "past" : "upcoming"} events.</p>
      </section>
    );
  }
  return (
    <section>
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      <div className="space-y-2">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/atlas/events/${event.id}`}
            className="block p-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20"
          >
            <p className="font-medium text-sm">{event.title}</p>
            <p className="text-xs text-muted mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(event.starts_at).toLocaleDateString()}
              {event.location && ` · ${event.is_online ? "Online" : event.location}`}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
      <Icon className="h-4 w-4 text-gold mb-2" />
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function ShowcaseDetails({ showcase }: { showcase: Record<string, unknown> }) {
  return (
    <dl className="space-y-3 text-sm">
      {Object.entries(showcase).map(([key, value]) => (
        <div key={key}>
          <dt className="text-muted capitalize">{key.replace(/_/g, " ")}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words">
            {formatShowcaseValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatShowcaseValue(value: unknown): React.ReactNode {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc pl-4 space-y-1">
        {value.map((item, index) => (
          <li key={index}>{formatShowcaseValue(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <dl className="space-y-2 pl-2 border-l border-white/10">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted capitalize">{k.replace(/_/g, " ")}</dt>
            <dd className="mt-0.5">{formatShowcaseValue(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return String(value);
}

function AboutBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="p-4 rounded-xl border border-white/10 bg-white/5">{children}</div>
    </section>
  );
}
