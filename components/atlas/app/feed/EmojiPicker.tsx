"use client";

import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const EMOJIS = [
  "😀", "😂", "😊", "😍", "🥳", "👍", "👏", "🙌", "💪", "🔥",
  "✨", "🎉", "❤️", "💯", "🚀", "📈", "💼", "🤝", "👀", "🙏",
  "😎", "🤔", "😅", "🎯", "⭐", "✅", "📣", "💡", "🌍", "🏆",
];

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  className?: string;
};

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Insert emoji"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-colors"
      >
        <Smile className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-xl border border-white/10 bg-surface-2 p-2 shadow-xl">
          <div className="grid grid-cols-6 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-lg p-1.5 text-lg hover:bg-white/10 transition-colors"
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
