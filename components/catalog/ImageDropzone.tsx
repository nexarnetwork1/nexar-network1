"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { cn } from "@/lib/utils/cn";

const DEFAULT_ACCEPT: Accept = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

type ImageDropzoneProps = {
  onFileChange: (file: File | null) => void;
  currentImageUrl?: string | null;
  label?: string;
  error?: string;
};

export function ImageDropzone({
  onFileChange,
  currentImageUrl,
  label = "Product image",
  error,
}: ImageDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      onFileChange(accepted[0] ?? null);
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: DEFAULT_ACCEPT,
    maxFiles: 1,
    multiple: false,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (acceptedFiles[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [acceptedFiles]);

  const preview = objectUrl ?? currentImageUrl;

  return (
    <div className="space-y-2">
      {label && (
        <p className="block text-sm font-medium text-muted">{label}</p>
      )}
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center transition-colors",
          "hover:border-gold/30 hover:bg-surface/60",
          isDragActive && "border-gold/50 bg-gold/5",
          error && "border-red-500/50"
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="mx-auto h-32 w-32 rounded-xl object-cover"
          />
        ) : (
          <p className="text-sm text-muted">
            {isDragActive
              ? "Drop the image here…"
              : "Drag & drop an image, or click to select"}
          </p>
        )}
        <p className="mt-2 text-xs text-muted">JPEG, PNG, WebP, GIF</p>
      </div>
      {acceptedFiles[0] && (
        <button
          type="button"
          onClick={() => onFileChange(null)}
          className="text-xs text-muted hover:text-white"
        >
          Remove selected image
        </button>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
