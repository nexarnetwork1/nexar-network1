"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Image as ImageIcon,
  Video,
  BarChart3,
  FileText,
  Megaphone,
  Loader2,
  X,
  Plus,
  Upload,
  Briefcase,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { useAtlasAuth } from "@/components/atlas/auth/AtlasAuthProvider";
import {
  createAtlasPostAction,
  createAtlasPollPostAction,
  uploadNetworkMediaAction,
} from "@/modules/atlas-network/actions";
import { toast } from "sonner";
import { AutoResizeTextarea } from "./feed/AutoResizeTextarea";
import { EmojiPicker } from "./feed/EmojiPicker";
import { AiAssistMenu } from "@/components/atlas/ai/AiAssistMenu";
import {
  POST_BODY_MAX,
  VISIBILITY_OPTIONS,
  loadDraft,
  saveDraft,
  clearDraft,
  type PostDraft,
} from "./feed/feed-utils";
import type { NetworkPostVisibility } from "@/modules/atlas-network/types";

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
  const { openAtlasAuth } = useAtlasAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<NetworkPostVisibility>("public");
  const [postType, setPostType] = useState<
    "text" | "image" | "video" | "pdf" | "poll" | "announcement"
  >(
    defaultPostType === "poll"
      ? "poll"
      : defaultPostType === "announcement"
        ? "announcement"
        : "text",
  );
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [uploading, setUploading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const requireAuth = () => {
    openAtlasAuth({
      mode: "signin",
      redirect: "/atlas/create-post",
      message: "Sign in to create a post",
    });
  };

  useEffect(() => {
    if (draftLoaded) return;
    const draft = loadDraft();
    if (draft) {
      setBody(draft.body);
      setTitle(draft.title);
      setVisibility(draft.visibility);
      setPollOptions(draft.pollOptions.length >= 2 ? draft.pollOptions : ["", ""]);
      if (draft.postType === "poll" || draft.postType === "announcement") {
        setPostType(draft.postType);
      }
      toast.message("Draft restored");
    }
    setDraftLoaded(true);
  }, [draftLoaded]);

  useEffect(() => {
    if (!draftLoaded) return;
    const timer = window.setTimeout(() => {
      if (!body.trim() && !title.trim() && media.length === 0) return;
      const draft: PostDraft = {
        body,
        title,
        postType,
        visibility,
        pollOptions,
        savedAt: new Date().toISOString(),
      };
      saveDraft(draft);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [body, title, postType, visibility, pollOptions, media.length, draftLoaded]);

  const uploadFiles = useCallback(
    async (files: File[], kind: "image" | "video" | "document") => {
      if (!session) {
        requireAuth();
        return;
      }
      if (!files.length) return;

      setUploading(true);
      try {
        for (const file of files) {
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
    },
    [session],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return;
      const first = accepted[0];
      let kind: "image" | "video" | "document" = "document";
      if (first.type.startsWith("image/")) kind = "image";
      else if (first.type.startsWith("video/")) kind = "video";
      void uploadFiles(accepted, kind);
    },
    [uploadFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled: uploading || pending,
    accept: {
      "image/*": [],
      "video/*": [],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
  });

  const handleFileSelect = async (files: FileList | null, kind: "image" | "video" | "document") => {
    if (!files?.length) return;
    await uploadFiles(Array.from(files), kind);
  };

  const handleSaveDraft = () => {
    saveDraft({
      body,
      title,
      postType,
      visibility,
      pollOptions,
      savedAt: new Date().toISOString(),
    });
    toast.success("Draft saved");
  };

  const handleSubmit = () => {
    if (!session) {
      requireAuth();
      return;
    }
    if (!body.trim() && postType !== "poll" && media.length === 0) {
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
            visibility,
          });
        } else {
          await createAtlasPostAction({
            postType: postType === "announcement" ? "announcement" : postType,
            title: title.trim() || undefined,
            body: body.trim(),
            visibility,
            media: media.map((m) => ({
              url: m.url,
              mediaType: m.mediaType,
            })),
            asAnnouncement: postType === "announcement",
          });
        }
        clearDraft();
        toast.success("Post published");
        router.push(redirectOnSuccess);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to publish");
      }
    });
  };

  const charCount = body.length;
  const charOver = charCount > POST_BODY_MAX;

  return (
    <div className={cn("max-w-2xl mx-auto py-6 px-3 sm:px-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold">Create Post</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="post-visibility" className="text-xs text-muted sr-only">
            Visibility
          </label>
          <select
            id="post-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as NetworkPostVisibility)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold/40"
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface-2">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "nxr-card p-4 space-y-4 transition-colors duration-150",
          isDragActive ? "border-gold/50 bg-gold/5" : "",
        )}
      >
        <input {...getInputProps()} />

        {isDragActive && (
          <div className="flex items-center justify-center gap-2 py-8 text-gold text-sm border border-dashed border-gold/40 rounded-xl">
            <Upload className="h-5 w-5" />
            Drop files to attach
          </div>
        )}

        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent border-b border-white/10 pb-2 text-lg font-medium placeholder:text-muted focus:outline-none focus:border-gold/40"
        />

        <div className="flex flex-wrap items-center gap-2">
          <AiAssistMenu
            surface="post"
            text={body || title}
            context={{ title, postType }}
            onApply={(content, action) => {
              if (action === "generate_title") {
                setTitle(content.split("\n")[0]?.trim() ?? content);
              } else if (action === "continue_writing") {
                setBody((b) => `${b}${b ? "\n\n" : ""}${content}`);
              } else if (action === "generate_hashtags") {
                setBody((b) => `${b.trim()}\n\n${content}`.trim());
              } else {
                setBody(content);
              }
            }}
            disabled={!session}
          />
          {(postType === "announcement" || media.length > 0) && (
            <AiAssistMenu
              surface="marketplace"
              text={body || title}
              context={{ productName: title || body.slice(0, 80) }}
              onApply={(content) => setBody(content)}
              disabled={!session}
              label="Product AI"
            />
          )}
        </div>

        <div className="relative">
          <AutoResizeTextarea
            placeholder={
              postType === "poll"
                ? "Ask a question..."
                : postType === "announcement"
                  ? "Share a company announcement..."
                  : "What do you want to talk about?"
            }
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, POST_BODY_MAX + 500))}
            maxLength={POST_BODY_MAX}
          />
          <div className="flex items-center justify-between mt-2">
            <EmojiPicker onSelect={(emoji) => setBody((b) => b + emoji)} />
            <span
              className={cn(
                "text-xs tabular-nums",
                charOver ? "text-red-400" : charCount > POST_BODY_MAX * 0.9 ? "text-gold" : "text-muted",
              )}
            >
              {charCount.toLocaleString()} / {POST_BODY_MAX.toLocaleString()}
            </span>
          </div>
        </div>

        {media.length > 0 && (
          <div
            className={cn(
              "grid gap-2",
              media.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1",
            )}
          >
            {media.map((item, i) => (
              <div key={item.url} className="relative rounded-lg overflow-hidden border border-white/10">
                {item.mediaType === "image" ? (
                  <img src={item.url} alt="" className="w-full max-h-48 object-cover" />
                ) : item.mediaType === "video" ? (
                  <video src={item.url} controls className="w-full max-h-48" />
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-white/5 min-h-[80px]">
                    <FileText className="h-8 w-8 text-gold shrink-0" />
                    <span className="text-sm truncate">{item.name ?? "Document"}</span>
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Remove media"
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

        <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-2 border-t border-white/10">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleFileSelect(e.target.files, "image");
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (!session) return requireAuth();
              fileRef.current?.setAttribute("accept", "image/*");
              fileRef.current?.setAttribute("multiple", "");
              fileRef.current?.click();
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-white/5 text-muted text-sm"
          >
            <ImageIcon className="h-4 w-4 text-gold" />
            <span className="hidden xs:inline">Photo</span>
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (!session) return requireAuth();
              fileRef.current?.setAttribute("accept", "video/*");
              fileRef.current?.removeAttribute("multiple");
              fileRef.current?.click();
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-white/5 text-muted text-sm"
          >
            <Video className="h-4 w-4 text-green-400" />
            <span className="hidden xs:inline">Video</span>
          </button>
          <button
            type="button"
            onClick={() => setPostType(postType === "poll" ? "text" : "poll")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm",
              postType === "poll" ? "bg-gold-soft text-gold" : "hover:bg-white/5 text-muted",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden xs:inline">Poll</span>
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (!session) return requireAuth();
              fileRef.current?.setAttribute("accept", ".pdf,.doc,.docx,.txt");
              fileRef.current?.removeAttribute("multiple");
              fileRef.current?.click();
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-white/5 text-muted text-sm"
          >
            <FileText className="h-4 w-4 text-gold" />
            <span className="hidden xs:inline">Document</span>
          </button>
          <button
            type="button"
            onClick={() => setPostType(postType === "announcement" ? "text" : "announcement")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm",
              postType === "announcement" ? "bg-gold/10 text-gold" : "hover:bg-white/5 text-muted",
            )}
          >
            <Megaphone className="h-4 w-4" />
            <span className="hidden xs:inline">Announcement</span>
          </button>
          <Link
            href="/atlas/jobs/new"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-white/5 text-muted text-sm"
          >
            <Briefcase className="h-4 w-4 text-gold" />
            <span className="hidden xs:inline">Job</span>
          </Link>
          <Link
            href="/atlas/events/new"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-white/5 text-muted text-sm"
          >
            <Calendar className="h-4 w-4 text-gold" />
            <span className="hidden xs:inline">Event</span>
          </Link>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2.5 rounded-lg border border-white/10 text-sm hover:bg-white/5"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={pending || uploading || charOver}
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
