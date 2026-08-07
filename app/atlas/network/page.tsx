import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchGlobalActivityAction } from "@/modules/atlas-network/actions";
import { ActivityItem } from "@/components/atlas/activity/ActivityItem";
import { PremiumSection } from "@/components/atlas/premium/PremiumSection";
import { PremiumStats } from "@/components/atlas/premium/PremiumStats";
import {
  ArrowRight,
  Users,
  Building2,
  MessageSquare,
  Calendar,
  Briefcase,
  Globe,
  Search,
  Sparkles,
} from "lucide-react";

const CATEGORY_ROUTES: Record<string, string> = {
  Companies: "/atlas/network",
  Professionals: "/atlas/network",
  Jobs: "/atlas/jobs",
  Events: "/atlas/events",
  Communities: "/atlas/network",
  Discussions: "/atlas",
};

export default async function AtlasNetworkPage() {
  const supabase = createAdminClient();
  const { activities: recentActivities } = await fetchGlobalActivityAction({ limit: 12 });

  // Fetch real network profiles
  const { data: profiles } = await supabase
    .from("atlas_network_profiles")
    .select("*")
    .eq("privacy", "public")
    .is("deleted_at", null)
    .order("follower_count", { ascending: false })
    .limit(12);

  // Fetch real posts
  const { data: posts } = await supabase
    .from("atlas_network_posts")
    .select("*")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(8);

  // Fetch real activities
  const { data: activities } = await supabase
    .from("atlas_network_activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const profileCount = profiles?.length || 0;
  const postCount = posts?.length || 0;
  const connectionCount = activities?.filter((a: any) => a.activity_type === "connection_accepted").length || 0;

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <PremiumSection variant="gradient" padding="xl">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Business Network
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent">
            ATLAS Network
          </h1>
          <p className="text-2xl lg:text-3xl text-gold font-light tracking-wide">
            Professional Business Community
          </p>
          <p className="text-lg text-muted max-w-3xl mx-auto">
            Join the ATLAS Network — a professional business community where companies,
            professionals, and innovators connect, collaborate, and grow together.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/atlas/create-post"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gold border border-gold/30 text-background hover:bg-gold-secondary transition-colors font-medium text-lg"
            >
              Create Profile
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/atlas"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-colors font-medium text-lg"
            >
              View Feed
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </PremiumSection>

      {/* Live Stats */}
      <PremiumSection variant="dark" padding="lg">
        <PremiumStats
          stats={[
            { label: "Active Profiles", value: profileCount.toString(), description: "Business professionals" },
            { label: "Companies", value: profiles?.filter((p: any) => p.subject_type === "business").length.toString() || "0", description: "Registered businesses" },
            { label: "Posts & Updates", value: postCount.toString(), description: "Community content" },
            { label: "Connections", value: connectionCount.toString(), description: "Business relationships" },
          ]}
        />
      </PremiumSection>

      {/* Network Categories */}
      <PremiumSection padding="lg">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold">Explore the Network</h2>
          <p className="text-muted">Find companies, professionals, and opportunities</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <NetworkCategory icon={Building2} label="Companies" count={profiles?.filter((p: any) => p.subject_type === "business").length || 0} />
          <NetworkCategory icon={Users} label="Professionals" count={profiles?.filter((p: any) => p.subject_type === "user").length || 0} />
          <NetworkCategory icon={Briefcase} label="Jobs" count={activities?.filter((a: any) => a.activity_type === "job_posted").length || 0} />
          <NetworkCategory icon={Calendar} label="Events" count={activities?.filter((a: any) => a.activity_type === "event_created").length || 0} />
          <NetworkCategory icon={Globe} label="Communities" count={0} />
          <NetworkCategory icon={MessageSquare} label="Discussions" count={postCount} />
        </div>
      </PremiumSection>

      {/* Featured Profiles */}
      <PremiumSection padding="xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Profiles</h2>
            <p className="text-muted">Active businesses and professionals on the network</p>
          </div>
          <Link
            href="/atlas/search"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
        </div>

        {profiles && profiles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile: any) => (
              <NetworkProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted">No profiles available yet. Be the first to join the network!</p>
          </div>
        )}
      </PremiumSection>

      {/* Recent Activity Feed */}
      <PremiumSection variant="dark" padding="xl">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold">Network Activity</h2>
          <p className="text-muted">Latest business activity across ATLAS</p>
        </div>

        {recentActivities.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-2">
            {recentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-4">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted">No activity yet. Start the conversation!</p>
            <Link href="/atlas/create-post" className="inline-block mt-4 text-gold hover:underline text-sm">
              Create a post
            </Link>
          </div>
        )}
      </PremiumSection>

      {/* CTA Section */}
      <PremiumSection variant="gold" padding="xl">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold">Join the ATLAS Network</h2>
          <p className="text-xl text-muted leading-relaxed">
            Connect with businesses, discover opportunities, and grow your professional network.
            Your next partnership or opportunity is just a connection away.
          </p>
          <Link
            href="/atlas/create-post"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gold border border-gold/30 text-background hover:bg-gold-secondary transition-colors font-medium text-lg"
          >
            Create Your Profile
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </PremiumSection>
    </div>
  );
}

function NetworkCategory({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={CATEGORY_ROUTES[label] ?? "/atlas/network"}
      className="group block p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/10 transition-all"
    >
      <Icon className="h-8 w-8 text-gold mb-4 group-hover:scale-110 transition-transform" />
      <h3 className="font-semibold mb-1">{label}</h3>
      <p className="text-sm text-muted">{count} items</p>
    </Link>
  );
}

function NetworkProfileCard({ profile }: { profile: any }) {
  return (
    <Link
      href={`/atlas/network/${profile.slug}`}
      className="group block p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/10 transition-all"
    >
      <div className="flex items-start gap-4 mb-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name} className="h-16 w-16 rounded-xl object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-gold/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-gold/30" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate group-hover:text-gold transition-colors">{profile.display_name}</h3>
            {profile.verified && (
              <span className="text-gold text-xs">✓</span>
            )}
          </div>
          <p className="text-sm text-muted truncate">{profile.headline || profile.profile_kind}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{profile.follower_count || 0} followers</span>
        <span className="px-2 py-1 rounded-full bg-white/10 text-xs capitalize">{profile.subject_type}</span>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: any }) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
          <Users className="h-6 w-6 text-gold/30" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted capitalize">{post.post_type}</span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted">
              {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Recently"}
            </span>
          </div>
          {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}
          {post.body && <p className="text-muted line-clamp-3">{post.body}</p>}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted">
            <span>{post.reaction_counts?.like || 0} likes</span>
            <span>{post.comment_count || 0} comments</span>
            <span>{post.share_count || 0} shares</span>
          </div>
        </div>
      </div>
    </div>
  );
}
