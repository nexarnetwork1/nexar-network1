"use client";

import { useState } from "react";
import { FileText, Download, Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type FeedMediaItem = {
  type: "image" | "video" | "document";
  url: string;
  thumbnail_url?: string;
  name?: string;
};

type PostMediaGalleryProps = {
  media: FeedMediaItem[];
  className?: string;
};

export function PostMediaGallery({ media, className }: PostMediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");
  const documents = media.filter((m) => m.type === "document");

  const openLightbox = (url: string) => {
    const idx = images.findIndex((img) => img.url === url);
    if (idx >= 0) setLightboxIndex(idx);
  };

  return (
    <div className={cn("mb-3 space-y-2", className)}>
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-1 rounded-xl overflow-hidden border border-white/10",
            images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2",
          )}
        >
          {images.map((item, index) => (
            <button
              key={item.url}
              type="button"
              onClick={() => openLightbox(item.url)}
              className={cn(
                "relative bg-black/40 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                images.length === 3 && index === 0 ? "row-span-2 min-h-[200px]" : "aspect-video",
              )}
            >
              <img
                src={item.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover hover:scale-[1.02] transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      )}

      {videos.map((item) => (
        <div
          key={item.url}
          className="relative rounded-xl overflow-hidden border border-white/10 bg-black"
        >
          {item.thumbnail_url ? (
            <div className="relative aspect-video">
              <img
                src={item.thumbnail_url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-12 w-12 text-white/90 drop-shadow-lg" />
              </div>
            </div>
          ) : null}
          <video src={item.url} controls preload="metadata" className="w-full max-h-96" />
        </div>
      ))}

      {documents.map((item) => {
        const isPdf = item.url.toLowerCase().includes(".pdf") || item.name?.toLowerCase().endsWith(".pdf");
        const fileName = item.name ?? item.url.split("/").pop() ?? "Document";

        return (
          <div
            key={item.url}
            className="rounded-xl border border-white/10 overflow-hidden bg-white/5"
          >
            {isPdf ? (
              <iframe
                src={item.url}
                title={fileName}
                className="w-full h-64 bg-white"
                loading="lazy"
              />
            ) : null}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-3 p-4 hover:bg-white/10 transition-colors"
            >
              <FileText className="h-8 w-8 text-gold shrink-0" />
              <span className="text-sm truncate flex-1">{fileName}</span>
              <Download className="h-4 w-4 text-muted shrink-0" />
            </a>
          </div>
        );
      })}

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="Close gallery"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-4 p-2 rounded-full bg-black/60 hover:bg-black text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i! > 0 ? i! - 1 : images.length - 1));
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i! < images.length - 1 ? i! + 1 : 0));
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={images[lightboxIndex].url}
            alt=""
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
