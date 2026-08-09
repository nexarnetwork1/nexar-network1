"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { Image as ImageIcon, Video, BarChart3, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAtlasAuth } from "@/components/atlas/auth/AtlasAuthProvider";
import type { NetworkFeedPost } from "@/modules/atlas-network/types";
import { fetchNetworkFeedAction } from "@/modules/atlas-network/actions";
import { FeedPostCard } from "./feed/FeedPostCard";
import { FeedSkeletonList } from "./feed/FeedSkeleton";

const PAGE_SIZE = 20;

interface SocialFeedProps {
  posts: NetworkFeedPost[];
  initialHasMore?: boolean;
}

export function SocialFeed({ posts: initialPosts, initialHasMore = true }: SocialFeedProps) {
  const { data: session } = useSession();
  const { openAtlasAuth } = useAtlasAuth();
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore && initialPosts.length >= PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requireAuth = useCallback(
    (redirect?: string) => {
      openAtlasAuth({
        mode: "signin",
        redirect: redirect ?? "/atlas",
        message: "Sign in to interact on ATLAS",
      });
    },
    [openAtlasAuth],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await fetchNetworkFeedAction({ offset: posts.length, limit: PAGE_SIZE });
      setPosts((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const fresh = result.posts.filter((p) => !existing.has(p.id));
        return [...prev, ...fresh];
      });
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, posts.length]);

  const { ref: sentinelRef } = useInView({
    rootMargin: "200px",
    onChange: (inView) => {
      if (inView) void loadMore();
    },
  });

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-4">
      <ComposerPrompt session={!!session} onAuth={() => requireAuth("/atlas/create-post")} />

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/25 bg-red-500/5">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => void loadMore()}
              className="mt-2 text-xs text-gold hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              session={!!session}
              onAuth={() => requireAuth()}
              onUpdate={(updated) =>
                setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
            />
          ))}

          {hasMore && (
            <div ref={sentinelRef} className="py-2">
              {loadingMore && <FeedSkeletonList count={2} />}
            </div>
          )}

          {!hasMore && posts.length > PAGE_SIZE && (
            <p className="text-center text-xs text-muted py-4">You&apos;re all caught up</p>
          )}
        </>
      ) : (
        <div className="p-8 nxr-card text-center">
          <p className="text-muted mb-2">No posts yet</p>
          <p className="text-sm text-muted mb-4">
            Be the first to share something with the ATLAS community.
          </p>
          <Link
            href="/atlas/create-post"
            className="inline-flex px-4 py-2 rounded-lg bg-gold text-background text-sm font-medium hover:bg-gold-secondary"
          >
            Create Post
          </Link>
        </div>
      )}
    </div>
  );
}

function ComposerPrompt({ session, onAuth }: { session: boolean; onAuth: () => void }) {
  if (session) {
    return (
      <Link
        href="/atlas/create-post"
        className="block p-4 nxr-card nxr-card-interactive"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gold/10 border border-gold/20" />
          <span className="flex-1 text-left text-muted">Start a post...</span>
          <div className="hidden sm:flex items-center gap-1 text-muted">
            <ImageIcon className="h-4 w-4" />
            <Video className="h-4 w-4" />
            <BarChart3 className="h-4 w-4" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onAuth}
      className="w-full p-4 nxr-card nxr-card-interactive text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gold/10 border border-gold/20" />
        <span className="text-muted">Start a post — sign in to share</span>
      </div>
    </button>
  );
}
