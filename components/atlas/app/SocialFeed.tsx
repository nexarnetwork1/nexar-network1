"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  BarChart3,
  FileText,
  Play,
  Send,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import type { NetworkFeedPost } from "@/modules/atlas-network/types";
import {
  addPostCommentAction,
  togglePostReactionAction,
  votePollAction,
} from "@/modules/atlas-network/actions";
import { toast } from "sonner";

interface SocialFeedProps {
  posts: NetworkFeedPost[];
}

function reactionTotal(post: NetworkFeedPost): number {
  const counts = post.reaction_counts ?? {};
  return Object.values(counts).reduce((a, b) => a + b, 0) || (post.user_reacted ? 1 : 0);
}

export function SocialFeed({ posts: initialPosts }: SocialFeedProps) {
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const [posts, setPosts] = useState(initialPosts);

  const requireAuth = (redirect?: string) => {
    openCommerceAuth({
      mode: "signin",
      redirect: redirect ?? "/atlas",
      message: "Sign in to interact on ATLAS",
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-4">
      <ComposerPrompt session={!!session} onAuth={() => requireAuth("/atlas/create-post")} />

      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            session={!!session}
            onAuth={requireAuth}
            onUpdate={(updated) =>
              setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
            }
          />
        ))
      ) : (
        <div className="p-8 rounded-xl border border-white/10 bg-white/5 text-center">
          <p className="text-muted mb-2">No posts yet</p>
          <p className="text-sm text-muted mb-4">Be the first to share something with the ATLAS community.</p>
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
        className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20 transition-colors"
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
      className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gold/10 border border-gold/20" />
        <span className="text-muted">Start a post — sign in to share</span>
      </div>
    </button>
  );
}

function PostCard({
  post,
  session,
  onAuth,
  onUpdate,
}: {
  post: NetworkFeedPost;
  session: boolean;
  onAuth: () => void;
  onUpdate: (post: NetworkFeedPost) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const [liked, setLiked] = useState(post.user_reacted ?? false);
  const [reactionCount, setReactionCount] = useState(reactionTotal(post));

  const media = (post.media ?? []).map((m) => ({
    type: (m.media_type === "image" || m.media_type === "video" || m.media_type === "document"
      ? m.media_type
      : "document") as "image" | "video" | "document",
    url: m.media_url,
    thumbnail_url: (m.metadata?.thumbnail_url as string) ?? undefined,
  }));

  const handleLike = () => {
    if (!session) return onAuth();
    const next = !liked;
    setLiked(next);
    setReactionCount((c) => Math.max(0, c + (next ? 1 : -1)));
    startTransition(async () => {
      try {
        const result = await togglePostReactionAction({
          targetType: "post",
          targetId: post.id,
        });
        setLiked(result.reacted);
        setReactionCount(result.count);
      } catch {
        setLiked(!next);
        setReactionCount((c) => Math.max(0, c + (next ? -1 : 1)));
        toast.error("Could not update reaction");
      }
    });
  };

  const handleComment = () => {
    if (!session) return onAuth();
    if (!comment.trim()) return;
    startTransition(async () => {
      try {
        await addPostCommentAction({ postId: post.id, body: comment.trim() });
        setComment("");
        onUpdate({
          ...post,
          comment_count: (post.comment_count ?? 0) + 1,
        });
        toast.success("Comment added");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to comment");
      }
    });
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (!session) return onAuth();
    startTransition(async () => {
      try {
        await votePollAction({ pollId, optionId });
        toast.success("Vote recorded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to vote");
      }
    });
  };

  const commentCount = post.comment_count ?? post.comments?.length ?? 0;
  const totalPollVotes =
    post.poll?.options.reduce((sum, o) => sum + (o.vote_count ?? 0), 0) ?? 0;

  return (
    <article className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {post.author?.avatar_url ? (
            <img src={post.author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gold/10 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-semibold truncate">{post.author?.display_name ?? "Member"}</span>
              {post.author?.verified && <span className="text-gold text-xs">✓</span>}
              {post.business && (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-sm text-muted truncate">{post.business.name}</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted capitalize">
              {post.published_at ? new Date(post.published_at).toLocaleString() : "Recently"} · {post.post_type}
            </p>
          </div>
        </div>
        <button type="button" className="p-2 rounded-lg hover:bg-white/5 shrink-0">
          <MoreHorizontal className="h-4 w-4 text-muted" />
        </button>
      </div>

      {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}
      {post.body && <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.body}</p>}

      {post.post_type === "job" && post.metadata && (
        <div className="mb-3 p-3 rounded-lg bg-gold/5 border border-gold/20 text-sm space-y-1">
          {(post.metadata as Record<string, string>).location && (
            <p>📍 {(post.metadata as Record<string, string>).location}</p>
          )}
          {(post.metadata as Record<string, string>).employment_type && (
            <p className="capitalize">{(post.metadata as Record<string, string>).employment_type.replace("_", " ")}</p>
          )}
          <Link href={`/atlas/jobs/${post.id}`} className="text-gold hover:underline text-sm font-medium">
            View job →
          </Link>
        </div>
      )}

      {post.event && (
        <Link
          href={`/atlas/events/${post.event.id}`}
          className="block mb-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-gold/20 transition-colors"
        >
          <p className="font-medium">{post.event.title}</p>
          <p className="text-xs text-muted mt-1">
            {new Date(post.event.starts_at).toLocaleString()}
            {post.event.location ? ` · ${post.event.location}` : ""}
          </p>
        </Link>
      )}

      {post.poll && (
        <div className="mb-3 space-y-2">
          {post.poll.options.map((option) => {
            const pct = totalPollVotes > 0 ? Math.round((option.vote_count / totalPollVotes) * 100) : 0;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleVote(post.poll!.id, option.id)}
                className="w-full text-left px-3 py-2 rounded-lg border border-white/10 hover:border-gold/30 relative overflow-hidden"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-gold/10"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative text-sm flex justify-between gap-2">
                  <span>{option.label}</span>
                  <span className="text-muted">{pct}%</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {media.length > 0 && (
        <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
          {media.map((item, index) => (
            <div key={index}>
              {item.type === "image" && (
                <img src={item.url} alt="" className="w-full max-h-96 object-cover" />
              )}
              {item.type === "video" && (
                <video src={item.url} controls className="w-full max-h-96 bg-black" />
              )}
              {item.type === "document" && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10"
                >
                  <FileText className="h-8 w-8 text-orange-400" />
                  <span className="text-sm truncate">{item.url.split("/").pop()}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={handleLike}
          disabled={pending}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            liked ? "text-gold" : "text-muted hover:text-white",
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {reactionCount}
        </button>
        <button
          type="button"
          onClick={() => (session ? setShowComments((v) => !v) : onAuth())}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white"
        >
          <MessageSquare className="h-4 w-4" />
          {commentCount}
        </button>
        <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white">
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
          {(post.comments ?? []).map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-gold/10 shrink-0 overflow-hidden">
                {c.author?.avatar_url && (
                  <img src={c.author.avatar_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{c.author?.display_name ?? "Member"}</p>
                <p className="text-sm text-white/90">{c.body}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
            />
            <button
              type="button"
              disabled={pending || !comment.trim()}
              onClick={handleComment}
              className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
