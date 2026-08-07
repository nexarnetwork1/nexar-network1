"use client";

import { useState, useTransition } from "react";
import { Loader2, Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import {
  registerForEventAction,
  setEventReminderAction,
} from "@/modules/atlas-network/actions";
import { toast } from "sonner";

export function EventRegisterForm({
  eventId,
  initialRegistered = false,
  meetingUrl,
}: {
  eventId: string;
  initialRegistered?: boolean;
  meetingUrl?: string | null;
}) {
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const [registered, setRegistered] = useState(initialRegistered);
  const [reminderSet, setReminderSet] = useState(false);
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
      <div className="space-y-3">
        <div className="p-6 rounded-xl border border-gold/30 bg-gold/5 text-center">
          <p className="text-gold font-medium">You&apos;re registered</p>
          <p className="text-sm text-muted mt-1">Registration confirmation sent to your notifications.</p>
        </div>
        {meetingUrl && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-6 py-3 rounded-lg border border-gold/30 text-gold hover:bg-gold/10"
          >
            Join online event
          </a>
        )}
        {!reminderSet && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await setEventReminderAction({ eventId });
                  setReminderSet(true);
                  toast.success("Reminder set");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to set reminder");
                }
              })
            }
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-white/10 text-sm hover:border-gold/30"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Set reminder
          </button>
        )}
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
