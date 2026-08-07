"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { addPostCommentAction } from "@/modules/atlas-network/actions";
import { AiAssistMenu } from "@/components/atlas/ai/AiAssistMenu";
import { EmojiPicker } from "./EmojiPicker";
import {
  buildCommentTree,
  formatFeedTimestamp,
  isEdited,
  type CommentNode,
} from "./feed-utils";
import { renderRichText } from "./feed-rich-text";
import type { NetworkFeedPost } from "@/modules/atlas-network/types";

const REPLIES_PREVIEW = 3;

type CommentThreadProps = {
  post: NetworkFeedPost;
  session: boolean;
  onAuth: () => void;
  onCommentsChange: (comments: NetworkFeedPost["comments"]) => void;
  currentUser?: { name?: string | null; image?: string | null };
};

function CommentItem({
  comment,
  depth,
  session,
  onAuth,
  onReply,
  replyToId,
  setReplyToId,
  replyText,
  setReplyText,
  pending,
  onSubmitReply,
  threadText,
}: {
  comment: CommentNode;
  depth: number;
  session: boolean;
  onAuth: () => void;
  onReply: (parentId: string) => void;
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
  replyText: string;
  setReplyText: (v: string) => void;
  pending: boolean;
  onSubmitReply: (parentId: string) => void;
  threadText: string;
}) {
  const [showAllReplies, setShowAllReplies] = useState(false);
  const replies = comment.replies;
  const visibleReplies = showAllReplies ? replies : replies.slice(0, REPLIES_PREVIEW);
  const hiddenCount = replies.length - REPLIES_PREVIEW;

  return (
    <div className={cn(depth > 0 && "ml-4 sm:ml-6 border-l border-white/10 pl-3")}>
      <div className="flex gap-2 py-2">
        <div className="h-8 w-8 rounded-full bg-gold/10 shrink-0 overflow-hidden">
          {comment.author?.avatar_url && (
            <img src={comment.author.avatar_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-xs font-medium">{comment.author?.display_name ?? "Member"}</p>
            <span className="text-[10px] text-muted">{formatFeedTimestamp(comment.created_at)}</span>
            {isEdited(comment.created_at, comment.updated_at) && (
              <span className="text-[10px] text-muted">· Edited</span>
            )}
          </div>
          <p className="text-sm text-white/90 mt-0.5 whitespace-pre-wrap break-words">
            {renderRichText(comment.body)}
          </p>
          <button
            type="button"
            onClick={() => {
              if (!session) return onAuth();
              setReplyToId(replyToId === comment.id ? null : comment.id);
            }}
            className="mt-1 text-xs text-muted hover:text-gold"
          >
            Reply
          </button>
        </div>
      </div>

      {replyToId === comment.id && session && (
        <div className="flex flex-col gap-2 mb-2 ml-10">
          <div className="flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSubmitReply(comment.id)}
            />
            <EmojiPicker onSelect={(emoji) => setReplyText(replyText + emoji)} />
            <button
              type="button"
              disabled={pending || !replyText.trim()}
              onClick={() => onSubmitReply(comment.id)}
              className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <AiAssistMenu
            surface="comment"
            text={replyText || comment.body}
            context={{
              parentComment: comment.body,
              thread: threadText,
            }}
            onApply={(content) => setReplyText(content)}
          />
        </div>
      )}

      {visibleReplies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          session={session}
          onAuth={onAuth}
          onReply={onReply}
          replyToId={replyToId}
          setReplyToId={setReplyToId}
          replyText={replyText}
          setReplyText={setReplyText}
          pending={pending}
          onSubmitReply={onSubmitReply}
          threadText={threadText}
        />
      ))}

      {!showAllReplies && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAllReplies(true)}
          className="ml-10 mb-2 flex items-center gap-1 text-xs text-gold hover:underline"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Load {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
        </button>
      )}
    </div>
  );
}

export function CommentThread({
  post,
  session,
  onAuth,
  onCommentsChange,
  currentUser,
}: CommentThreadProps) {
  const [comment, setComment] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [pending, startTransition] = useTransition();

  const comments = post.comments ?? [];
  const tree = buildCommentTree(comments);
  const threadText = comments.map((c) => c.body).join("\n");

  const appendComment = (
    body: string,
    parentId?: string,
  ) => {
    startTransition(async () => {
      try {
        await addPostCommentAction({ postId: post.id, body: body.trim(), parentId });
        const optimistic = {
          id: `temp-${Date.now()}`,
          post_id: post.id,
          author_profile_id: "",
          parent_id: parentId ?? null,
          body: body.trim(),
          depth: parentId ? 1 : 0,
          mention_ids: [],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          author: {
            id: "",
            display_name: currentUser?.name ?? "You",
            avatar_url: currentUser?.image ?? null,
          },
        };
        onCommentsChange([...comments, optimistic]);
        setComment("");
        setReplyText("");
        setReplyToId(null);
        toast.success(parentId ? "Reply added" : "Comment added");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to comment");
      }
    });
  };

  const handleComment = () => {
    if (!session) return onAuth();
    if (!comment.trim()) return;
    appendComment(comment);
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim()) return;
    appendComment(replyText, parentId);
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
      {tree.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          depth={0}
          session={session}
          onAuth={onAuth}
          onReply={(id) => setReplyToId(id)}
          replyToId={replyToId}
          setReplyToId={setReplyToId}
          replyText={replyText}
          setReplyText={setReplyText}
          pending={pending}
          onSubmitReply={handleSubmitReply}
          threadText={threadText}
        />
      ))}

      <div className="flex flex-col gap-2 pt-2">
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={session ? "Write a comment..." : "Sign in to comment"}
            readOnly={!session}
            onClick={() => !session && onAuth()}
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
          />
          {session && <EmojiPicker onSelect={(emoji) => setComment(comment + emoji)} />}
          <button
            type="button"
            disabled={pending || !comment.trim() || !session}
            onClick={handleComment}
            className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {session && (
          <AiAssistMenu
            surface="comment"
            text={comment || threadText}
            context={{ thread: threadText, postTitle: post.title }}
            onApply={(content) => setComment(content)}
          />
        )}
      </div>
    </div>
  );
}
