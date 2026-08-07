"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

type AutoResizeTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxHeight?: number;
};

export function AutoResizeTextarea({
  className,
  maxHeight = 320,
  value,
  onChange,
  ...props
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={3}
      className={cn(
        "w-full bg-transparent text-sm leading-relaxed placeholder:text-muted focus:outline-none resize-none overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}
