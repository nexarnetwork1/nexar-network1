import Link from "next/link";
import { auth } from "@/auth";
import { AtlasGuestGate } from "@/components/atlas/app/AtlasGuestGate";
import {
  getPersonProfileByUserId,
  getNetworkProfileById,
  getNetworkPosts,
} from "@/modules/atlas-network/repository";
import { User, Settings, Edit } from "lucide-react";

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
  const posts = profile
    ? await getNetworkPosts({ authorProfileId: profile.id, limit: 10 })
    : [];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="p-6 rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-full bg-gold/10 border border-gold/30 overflow-hidden shrink-0">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-8 w-8 text-gold/50" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {profile?.display_name ?? session.user.name ?? "Your Profile"}
            </h1>
            {profile?.headline && <p className="text-muted mt-1">{profile.headline}</p>}
            <p className="text-sm text-muted mt-2">{session.user.email}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted">
              <span>{profile?.follower_count ?? 0} followers</span>
              <span>{profile?.following_count ?? 0} following</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-gold/30 text-sm"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <Link
            href="/atlas/create-post"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-background text-sm font-medium"
          >
            <Edit className="h-4 w-4" />
            Create Post
          </Link>
        </div>
      </div>

      <section>
        <h2 className="font-semibold mb-3">Your Posts</h2>
        {posts.length === 0 ? (
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 text-center text-muted text-sm">
            No posts yet.{" "}
            <Link href="/atlas/create-post" className="text-gold hover:underline">
              Share something
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                {post.title && <p className="font-medium">{post.title}</p>}
                {post.body && (
                  <p className="text-sm text-muted mt-1 line-clamp-3">{post.body}</p>
                )}
                <p className="text-xs text-muted mt-2 capitalize">
                  {post.post_type} ·{" "}
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString()
                    : "Draft"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
