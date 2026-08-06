"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Video,
  BarChart3,
  FileText,
  Megaphone,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import {
  createAtlasPostAction,
  createAtlasPollPostAction,
  uploadNetworkMediaAction,
} from "@/modules/atlas-network/actions";
import { toast } from "sonner";

type MediaPreview = {
  url: string;
  mediaType: "image" | "video" | "document";
  name?: string;
};

type PostComposerProps = {
  className?: string;
  defaultPostType?: "text" | "poll" | "announcement";
  redirectOnSuccess?: string;
};

export function PostComposer({
  className,
  defaultPostType = "text",
  redirectOnSuccess = "/atlas",
}: PostComposerProps) {
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState<"text" | "image" | "video" | "pdf" | "poll" | "announcement">(
    defaultPostType === "poll" ? "poll" : defaultPostType === "announcement" ? "announcement" : "text",
  );
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [uploading, setUploading] = useState(false);

  const requireAuth = () => {
    openCommerceAuth({
      mode: "signin",
      redirect: "/atlas/create-post",
      message: "Sign in to create a post",
    });
  };

  const handleFileSelect = async (files: FileList | null, kind: "image" | "video" | "document") => {
    if (!session) {
      requireAuth();
      return;
    }
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadNetworkMediaAction(fd);
        setMedia((prev) => [
          ...prev,
          {
            url: result.url,
            mediaType: result.mediaType ?? kind,
            name: file.name,
          },
        ]);
        if (result.mediaType === "image") setPostType("image");
        else if (result.mediaType === "video") setPostType("video");
        else setPostType("pdf");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!session) {
      requireAuth();
      return;
    }
    if (!body.trim() && postType !== "poll") {
      toast.error("Write something to share");
      return;
    }

    startTransition(async () => {
      try {
        if (postType === "poll") {
          const options = pollOptions.map((o) => o.trim()).filter(Boolean);
          if (options.length < 2) {
            toast.error("Add at least two poll options");
            return;
          }
          await createAtlasPollPostAction({
            postType: "poll",
            body: body.trim() || undefined,
            options,
          });
        } else {
          await createAtlasPostAction({
            postType: postType === "announcement" ? "announcement" : postType,
            title: title.trim() || undefined,
            body: body.trim(),
            media: media.map((m) => ({
              url: m.url,
              mediaType: m.mediaType,
            })),
            asAnnouncement: postType === "announcement",
          });
        }
        toast.success("Post published");
        router.push(redirectOnSuccess);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to publish");
      }
    });
  };

  return (
    <div className={cn("max-w-2xl mx-auto py-6 px-4", className)}>
      <h1 className="text-xl font-bold mb-6">Create Post</h1>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent border-b border-white/10 pb-2 text-lg font-medium placeholder:text-muted focus:outline-none focus:border-gold/40"
        />

        <textarea
          placeholder={
            postType === "poll"
              ? "Ask a question..."
              : postType === "announcement"
                ? "Share a company announcement..."
                : "What do you want to talk about?"
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full bg-transparent text-sm leading-relaxed placeholder:text-muted focus:outline-none resize-none"
        />

        {media.length > 0 && (
          <div className="grid gap-2">
            {media.map((item, i) => (
              <div key={item.url} className="relative rounded-lg overflow-hidden border border-white/10">
                {item.mediaType === "image" ? (
                  <img src={item.url} alt="" className="w-full max-h-64 object-cover" />
                ) : item.mediaType === "video" ? (
                  <video src={item.url} controls className="w-full max-h-64" />
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-white/5">
                    <FileText className="h-8 w-8 text-orange-400" />
                    <span className="text-sm truncate">{item.name ?? "Document"}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {postType === "poll" && (
          <div className="space-y-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2 text-muted hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button
                type="button"
                onClick={() => setPollOptions((prev) => [...prev, ""])}
                className="flex items-center gap-2 text-sm text-gold hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add option
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files, "image")}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (!session) return requireAuth();
              fileRef.current?.setAttribute("accept", "image/*");
              fileRef.current?.click();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-muted text-sm"
          >
            <ImageIcon className="h-4 w-4 text-blue-400" />
            Photo
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (!session) return requireAuth();
              fileRef.current?.setAttribute("accept", "video/*");
              fileRef.current?.click();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-muted text-sm"
          >
            <Video className="h-4 w-4 text-green-400" />
            Video
          </button>
          <button
            type="button"
            onClick={() => setPostType(postType === "poll" ? "text" : "poll")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              postType === "poll" ? "bg-purple-500/10 text-purple-300" : "hover:bg-white/5 text-muted",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Poll
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (!session) return requireAuth();
              fileRef.current?.setAttribute("accept", ".pdf,.doc,.docx,.txt");
              fileRef.current?.click();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-muted text-sm"
          >
            <FileText className="h-4 w-4 text-orange-400" />
            Document
          </button>
          <button
            type="button"
            onClick={() => setPostType(postType === "announcement" ? "text" : "announcement")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              postType === "announcement" ? "bg-gold/10 text-gold" : "hover:bg-white/5 text-muted",
            )}
          >
            <Megaphone className="h-4 w-4" />
            Announcement
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={pending || uploading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-background font-medium hover:bg-gold-secondary disabled:opacity-50 transition-colors"
          >
            {(pending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
