"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { contextualAssistAction } from "@/modules/atlas-ai/actions";
import {
  ASSIST_ACTION_LABELS,
  SURFACE_ACTIONS,
  type AiAssistAction,
  type AiAssistSurface,
} from "@/modules/atlas-ai/prompts-contextual";

type AiAssistMenuProps = {
  surface: AiAssistSurface;
  text: string;
  onApply: (content: string, action: AiAssistAction) => void;
  businessId?: string;
  context?: Record<string, unknown>;
  className?: string;
  disabled?: boolean;
  actions?: AiAssistAction[];
  label?: string;
};

export function AiAssistMenu({
  surface,
  text,
  onApply,
  businessId,
  context,
  className,
  disabled,
  actions: actionsOverride,
  label = "ATLAS AI",
}: AiAssistMenuProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const actions = actionsOverride ?? SURFACE_ACTIONS[surface];

  const runAction = (action: AiAssistAction) => {
    setOpen(false);
    startTransition(async () => {
      try {
        const result = await contextualAssistAction({
          surface,
          action,
          text,
          businessId,
          context,
        });
        if (!result.success || !result.content) {
          toast.error(result.error ?? "AI assist failed");
          return;
        }
        onApply(result.content, action);
        toast.success(
          result.mode === "openai" ? "AI suggestion applied" : "Demo AI suggestion applied",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "AI assist failed");
      }
    });
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
          "border border-gold/25 bg-gold/5 text-gold hover:bg-gold/10 disabled:opacity-50",
        )}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30"
            aria-label="Close AI menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-40 min-w-[200px] max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0a] shadow-xl py-1">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                disabled={pending}
                onClick={() => runAction(action)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 hover:text-gold transition-colors"
              >
                {ASSIST_ACTION_LABELS[action]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
