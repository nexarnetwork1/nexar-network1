"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { registerForEventAction } from "@/modules/atlas-network/actions";
import { toast } from "sonner";

export function EventRegisterForm({ eventId }: { eventId: string }) {
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const [registered, setRegistered] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!session) {
    return (
      <div className="p-6 rounded-xl border border-white/10 bg-white/5 text-center">
        <p className="text-muted mb-4">Sign in to register for this event</p>
        <button
          type="button"
          onClick={() =>
            openCommerceAuth({
              mode: "signin",
              redirect: `/atlas/events/${eventId}`,
            })
          }
          className="px-4 py-2 rounded-lg bg-gold text-background font-medium"
        >
          Sign In to Register
        </button>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="p-6 rounded-xl border border-gold/30 bg-gold/5 text-center">
        <p className="text-gold font-medium">You&apos;re registered</p>
        <p className="text-sm text-muted mt-1">See you at the event.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await registerForEventAction({ eventId });
              setRegistered(true);
              toast.success("Registered successfully");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Registration failed");
            }
          })
        }
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gold text-background font-medium disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Register for Event
      </button>
    </div>
  );
}
