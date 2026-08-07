"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { REACTION_OPTIONS } from "./feed-utils";
import type { NetworkReactionType } from "@/modules/atlas-network/types";

type ReactionPickerProps = {
  count: number;
  activeType?: NetworkReactionType | null;
  disabled?: boolean;
  onReact: (type: NetworkReactionType) => void;
  onAuth?: () => void;
  session: boolean;
};

export function ReactionPicker({
  count,
  activeType,
  disabled,
  onReact,
  onAuth,
  session,
}: ReactionPickerProps) {
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

  const active = REACTION_OPTIONS.find((r) => r.type === activeType) ?? REACTION_OPTIONS[0];

  const handleClick = () => {
    if (!session) {
      onAuth?.();
      return;
    }
    if (activeType) {
      onReact(activeType);
    } else {
      setOpen((v) => !v);
    }
  };

  const handleLongPress = () => {
    if (!session) return onAuth?.();
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          activeType ? "text-gold" : "text-muted hover:text-white",
        )}
      >
        <span aria-hidden>{active.emoji}</span>
        {count > 0 ? count : active.label}
      </button>

      {open && session && (
        <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-full border border-white/10 bg-surface-2 px-2 py-1.5 shadow-xl">
          {REACTION_OPTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              title={r.label}
              className={cn(
                "rounded-full p-1.5 text-lg hover:bg-white/10 transition-transform hover:scale-110",
                activeType === r.type && "bg-gold/15 ring-1 ring-gold/30",
              )}
              onClick={() => {
                onReact(r.type);
                setOpen(false);
              }}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
