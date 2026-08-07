"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Link2,
  Flag,
  Bookmark,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { getSavedPostIds, toggleSavedPost } from "./feed-utils";

type PostMenuProps = {
  postId: string;
  session: boolean;
  onAuth: () => void;
  onSavedChange?: (saved: boolean) => void;
};

export function PostMenu({ postId, session, onAuth, onSavedChange }: PostMenuProps) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaved(getSavedPostIds().includes(postId));
  }, [postId]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const postUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/atlas#post-${postId}`
      : `/atlas#post-${postId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
    setOpen(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: postUrl, title: "ATLAS Post" });
      } catch {
        /* user cancelled */
      }
    } else {
      await copyLink();
    }
    setOpen(false);
  };

  const handleSave = () => {
    if (!session) {
      onAuth();
      return;
    }
    const next = toggleSavedPost(postId);
    setSaved(next);
    onSavedChange?.(next);
    toast.success(next ? "Post saved" : "Removed from saved");
    setOpen(false);
  };

  const handleReport = () => {
    if (!session) {
      onAuth();
      return;
    }
    toast.message("Report received", {
      description: "Our team will review this post. Full moderation API coming soon.",
    });
    setOpen(false);
  };

  const items = [
    { icon: copied ? Check : Copy, label: "Copy link", action: copyLink },
    { icon: Share2, label: "Share", action: handleShare },
    { icon: Bookmark, label: saved ? "Unsave" : "Save", action: handleSave },
    { icon: Flag, label: "Report", action: handleReport, danger: true },
  ];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Post options"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-white/5"
      >
        <MoreHorizontal className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-white/10 bg-[#0a0a0a] py-1 shadow-xl">
          {items.map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 text-left",
                danger ? "text-red-400" : "text-white/90",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
          <div className="mx-3 my-1 border-t border-white/10" />
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
            <Link2 className="h-3.5 w-3.5" />
            <span className="truncate">{postId.slice(0, 8)}…</span>
          </div>
        </div>
      )}
    </div>
  );
}
