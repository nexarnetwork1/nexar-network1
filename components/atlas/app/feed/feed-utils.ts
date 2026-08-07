import type { NetworkComment, NetworkPostVisibility, NetworkReactionType } from "@/modules/atlas-network/types";

export const POST_BODY_MAX = 10_000;

export const VISIBILITY_OPTIONS: { value: NetworkPostVisibility; label: string }[] = [
  { value: "public", label: "Anyone" },
  { value: "followers", label: "Followers" },
  { value: "connections", label: "Connections" },
  { value: "organization_only", label: "Organization" },
  { value: "private", label: "Only me" },
];

export const REACTION_OPTIONS: {
  type: NetworkReactionType;
  label: string;
  emoji: string;
}[] = [
  { type: "like", label: "Like", emoji: "👍" },
  { type: "celebrate", label: "Celebrate", emoji: "🎉" },
  { type: "support", label: "Support", emoji: "💪" },
];

export function formatFeedTimestamp(iso: string | null | undefined): string {
  if (!iso) return "Recently";
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function isEdited(createdAt: string, updatedAt: string): boolean {
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 2_000;
}

export function visibilityLabel(visibility: NetworkPostVisibility): string {
  return VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label ?? visibility;
}

export type CommentNode = NetworkComment & {
  author?: { id: string; display_name: string; avatar_url: string | null } | null;
  replies: CommentNode[];
};

export function buildCommentTree(
  comments: (NetworkComment & {
    author?: { id: string; display_name: string; avatar_url: string | null } | null;
  })[],
): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function reactionTotal(post: {
  reaction_counts?: Record<string, number>;
  user_reacted?: boolean;
}): number {
  const counts = post.reaction_counts ?? {};
  return Object.values(counts).reduce((a, b) => a + b, 0) || (post.user_reacted ? 1 : 0);
}

export const DRAFT_STORAGE_KEY = "atlas-feed-post-draft";

export type PostDraft = {
  body: string;
  title: string;
  postType: string;
  visibility: NetworkPostVisibility;
  pollOptions: string[];
  savedAt: string;
};

export function loadDraft(): PostDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PostDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: PostDraft): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export const SAVED_POSTS_KEY = "atlas-feed-saved-posts";

export function getSavedPostIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_POSTS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function toggleSavedPost(postId: string): boolean {
  const ids = getSavedPostIds();
  const next = ids.includes(postId) ? ids.filter((id) => id !== postId) : [...ids, postId];
  localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(next));
  return next.includes(postId);
}
