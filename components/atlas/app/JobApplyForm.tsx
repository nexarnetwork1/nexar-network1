"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { applyToJobAction } from "@/modules/atlas-network/actions";
import { toast } from "sonner";

export function JobApplyForm({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const [message, setMessage] = useState("");
  const [applied, setApplied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!session) {
    return (
      <div className="p-6 rounded-xl border border-white/10 bg-white/5 text-center">
        <p className="text-muted mb-4">Sign in to apply for this role</p>
        <button
          type="button"
          onClick={() =>
            openCommerceAuth({
              mode: "signin",
              redirect: `/atlas/jobs/${postId}`,
            })
          }
          className="px-4 py-2 rounded-lg bg-gold text-background font-medium"
        >
          Sign In to Apply
        </button>
      </div>
    );
  }

  if (applied) {
    return (
      <div className="p-6 rounded-xl border border-gold/30 bg-gold/5 text-center">
        <p className="text-gold font-medium">Application submitted</p>
        <p className="text-sm text-muted mt-1">The company will review your application.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
      <h2 className="font-semibold">Apply for this role</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        placeholder="Tell them why you're a great fit..."
        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40 resize-none"
      />
      <button
        type="button"
        disabled={pending || message.trim().length < 10}
        onClick={() =>
          startTransition(async () => {
            try {
              await applyToJobAction({ postId, message: message.trim() });
              setApplied(true);
              toast.success("Application sent");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to apply");
            }
          })
        }
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-background font-medium disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Application
      </button>
    </div>
  );
}
