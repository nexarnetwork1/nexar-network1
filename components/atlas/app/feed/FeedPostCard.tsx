"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Share2, Bookmark, Megaphone, Package, Briefcase, Calendar, Globe, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { NetworkFeedPost, NetworkReactionType } from "@/modules/atlas-network/types";
import { togglePostReactionAction, votePollAction } from "@/modules/atlas-network/actions";
import { PostMediaGallery, type FeedMediaItem } from "./PostMediaGallery";
import { ReactionPicker } from "./ReactionPicker";
import { PostMenu } from "./PostMenu";
import { CommentThread } from "./CommentThread";
import {
  formatFeedTimestamp,
  isEdited,
  visibilityLabel,
  reactionTotal,
  getSavedPostIds,
  toggleSavedPost,
} from "./feed-utils";
import { renderRichText } from "./feed-rich-text";
import { listingProductHref } from "@/lib/atlas/marketplace-links";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { jobCategoryLabel } from "@/lib/atlas/job-categories";
import { jobMeta, isJobOpen } from "@/lib/atlas/job-utils";

type FeedPostCardProps = {
  post: NetworkFeedPost;
  session: boolean;
  onAuth: () => void;
  onUpdate: (post: NetworkFeedPost) => void;
};

function getActiveReactionType(post: NetworkFeedPost): NetworkReactionType | null {
  if (!post.user_reacted) return null;
  const counts = post.reaction_counts ?? {};
  const priority: NetworkReactionType[] = ["like", "celebrate", "support"];
  for (const type of priority) {
    if ((counts[type] ?? 0) > 0) return type;
  }
  return "like";
}

export function FeedPostCard({ post, session, onAuth, onUpdate }: FeedPostCardProps) {
  const { data: sessionData } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [pending, startTransition] = useTransition();
  const [activeReaction, setActiveReaction] = useState<NetworkReactionType | null>(
    getActiveReactionType(post),
  );
  const [reactionCount, setReactionCount] = useState(reactionTotal(post));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getSavedPostIds().includes(post.id));
  }, [post.id]);

  const media: FeedMediaItem[] = (post.media ?? []).map((m) => ({
    type: (m.media_type === "image" || m.media_type === "video" || m.media_type === "document"
      ? m.media_type
      : "document") as FeedMediaItem["type"],
    url: m.media_url,
    thumbnail_url: (m.metadata?.thumbnail_url as string) ?? undefined,
    name: (m.metadata?.filename as string) ?? undefined,
  }));

  const handleReact = (type: NetworkReactionType) => {
    const wasActive = activeReaction === type;
    setActiveReaction(wasActive ? null : type);
    setReactionCount((c) => Math.max(0, c + (wasActive ? -1 : activeReaction ? 0 : 1)));

    startTransition(async () => {
      try {
        const result = await togglePostReactionAction({
          targetType: "post",
          targetId: post.id,
          reactionType: type,
        });
        setActiveReaction(result.reacted ? type : null);
        setReactionCount(result.count);
        onUpdate({
          ...post,
          user_reacted: result.reacted,
          reaction_counts: {
            ...post.reaction_counts,
            [type]: result.count,
          },
        });
      } catch {
        setActiveReaction(getActiveReactionType(post));
        setReactionCount(reactionTotal(post));
        toast.error("Could not update reaction");
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

  const handleShare = async () => {
    const url = `${window.location.origin}/atlas#post-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: post.title ?? "ATLAS Post" });
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not share");
    }
  };

  const commentCount = post.comment_count ?? post.comments?.length ?? 0;
  const totalPollVotes =
    post.poll?.options.reduce((sum, o) => sum + (o.vote_count ?? 0), 0) ?? 0;

  return (
    <article
      id={`post-${post.id}`}
      className="nxr-card p-5 scroll-mt-24 transition-[border-color,background-color] duration-150 hover:border-gold/20"
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gold/10 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-semibold truncate">{post.author?.display_name ?? "Member"}</span>
              {post.author?.verified && (
                <span className="text-gold text-xs" title="Verified">
                  ✓
                </span>
              )}
              {post.business && (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-sm text-muted truncate">{post.business.display_name}</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span>{formatFeedTimestamp(post.published_at)}</span>
              {isEdited(post.created_at, post.updated_at) && (
                <>
                  <span>·</span>
                  <span>Edited</span>
                </>
              )}
              <span>·</span>
              <span className="capitalize">{visibilityLabel(post.visibility)}</span>
              {post.post_type === "announcement" && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5 text-gold">
                    <Megaphone className="h-3 w-3" />
                    Announcement
                  </span>
                </>
              )}
              {post.post_type === "job" && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5 text-gold">
                    <Briefcase className="h-3 w-3" />
                    Job
                  </span>
                </>
              )}
              {post.post_type === "event" && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5 text-gold">
                    <Calendar className="h-3 w-3" />
                    Event
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <PostMenu
          postId={post.id}
          session={session}
          onAuth={onAuth}
          onSavedChange={setSaved}
        />
      </div>

      {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}
      {post.body && (
        <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap break-words">
          {renderRichText(post.body)}
        </p>
      )}

      {post.post_type === "job" && (
        <JobPostPreview post={post} />
      )}

      {post.post_type === "product" && post.metadata && (
        <ProductPostPreview metadata={post.metadata as Record<string, unknown>} title={post.title} />
      )}

      {post.event && (
        <Link
          href={`/atlas/events/${post.event.id}`}
          className="block mb-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-gold/20 transition-colors"
        >
          <p className="font-medium">{post.event.title}</p>
          <p className="text-xs text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.event.starts_at).toLocaleString()}
            </span>
            {post.event.is_online ? (
              <span className="inline-flex items-center gap-1 text-gold">
                <Globe className="h-3 w-3" />
                Online
              </span>
            ) : post.event.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {post.event.location}
              </span>
            ) : null}
          </p>
        </Link>
      )}

      {post.poll && (
        <div className="mb-3 space-y-2">
          {post.poll.options.map((option) => {
            const pct =
              totalPollVotes > 0 ? Math.round((option.vote_count / totalPollVotes) * 100) : 0;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleVote(post.poll!.id, option.id)}
                className="w-full text-left px-3 py-2 rounded-lg border border-white/10 hover:border-gold/30 relative overflow-hidden"
              >
                <div className="absolute inset-y-0 left-0 bg-gold/10" style={{ width: `${pct}%` }} />
                <span className="relative text-sm flex justify-between gap-2">
                  <span>{option.label}</span>
                  <span className="text-muted">{pct}%</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {media.length > 0 && <PostMediaGallery media={media} />}

      <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-white/10">
        <ReactionPicker
          count={reactionCount}
          activeType={activeReaction}
          disabled={pending}
          session={session}
          onAuth={onAuth}
          onReact={handleReact}
        />
        <button
          type="button"
          onClick={() => (session ? setShowComments((v) => !v) : onAuth())}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            showComments ? "text-gold" : "text-muted hover:text-white",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {commentCount}
        </button>
        <button
          type="button"
          onClick={() => (session ? void handleShare() : onAuth())}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
        {session && (
          <button
            type="button"
            onClick={() => {
              const next = toggleSavedPost(post.id);
              setSaved(next);
              toast.success(next ? "Post saved" : "Removed from saved");
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ml-auto",
              saved ? "text-gold" : "text-muted hover:text-white",
            )}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        )}
      </div>

      {showComments && (
        <CommentThread
          post={post}
          session={session}
          onAuth={onAuth}
          currentUser={sessionData?.user}
          onCommentsChange={(comments) =>
            onUpdate({ ...post, comments, comment_count: comments?.length ?? 0 })
          }
        />
      )}
    </article>
  );
}

function JobPostPreview({ post }: { post: NetworkFeedPost }) {
  const meta = jobMeta(post);
  const open = isJobOpen(post);
  return (
    <Link
      href={`/atlas/jobs/${post.id}`}
      className="block mb-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/30 overflow-hidden transition-colors"
    >
      <div className="p-3 flex gap-3">
        <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
          <Briefcase className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm line-clamp-2">{post.title ?? "Open Role"}</p>
            <span
              className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                open ? "bg-success/10 text-success" : "bg-white/5 text-muted"
              }`}
            >
              {open ? "Hiring" : "Closed"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted">
            {meta.location && <span>{meta.location}</span>}
            {meta.employment_type && (
              <span className="capitalize">{meta.employment_type.replace("_", " ")}</span>
            )}
            {meta.category && <span className="text-gold">{jobCategoryLabel(meta.category)}</span>}
          </div>
          <p className="text-xs text-gold mt-2">View job →</p>
        </div>
      </div>
    </Link>
  );
}

function ProductPostPreview({
  metadata,
  title,
}: {
  metadata: Record<string, unknown>;
  title?: string | null;
}) {
  const productSlug =
    typeof metadata.productSlug === "string" ? metadata.productSlug : null;
  const listingSlug = typeof metadata.listingSlug === "string" ? metadata.listingSlug : null;
  const productId = typeof metadata.productId === "string" ? metadata.productId : null;
  const handle = productSlug ?? listingSlug ?? productId ?? "";
  const href = handle
    ? listingProductHref({ product_slug: productSlug, slug: listingSlug ?? handle, id: handle })
    : MARKETPLACE_ROUTES.root;
  const imageUrl = typeof metadata.imageUrl === "string" ? metadata.imageUrl : null;
  const price = typeof metadata.price === "number" ? metadata.price : null;
  const currency = typeof metadata.currency === "string" ? metadata.currency : "USD";
  const displayTitle =
    title ?? (typeof metadata.title === "string" ? metadata.title : "View product");

  return (
    <Link
      href={href}
      className="block mb-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/30 overflow-hidden transition-colors"
    >
      <div className="flex gap-0 sm:gap-0">
        <div className="w-28 sm:w-32 shrink-0 aspect-square bg-surface-1 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Package className="h-8 w-8 text-gold/40" />
          )}
        </div>
        <div className="p-3 min-w-0 flex flex-col justify-center">
          <p className="font-medium text-sm line-clamp-2">{displayTitle}</p>
          {price != null && (
            <p className="text-gold text-sm mt-1">
              {currency} {price.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted mt-2">View in Marketplace →</p>
        </div>
      </div>
    </Link>
  );
}
