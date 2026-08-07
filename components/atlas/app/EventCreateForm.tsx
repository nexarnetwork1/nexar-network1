"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { createAtlasEventAction } from "@/modules/atlas-network/actions";
import { toast } from "sonner";

export function EventCreateForm() {
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");

  if (!session) {
    return (
      <div className="p-8 rounded-xl border border-white/10 bg-white/5 text-center">
        <p className="text-muted mb-4">Sign in to create an event</p>
        <button
          type="button"
          onClick={() =>
            openCommerceAuth({ mode: "signin", redirect: "/atlas/events/new" })
          }
          className="px-4 py-2 rounded-lg bg-gold text-background font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-xl font-bold">Create Event</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-gold/40"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Description"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40 resize-none"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs text-muted">Starts</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Ends (optional)</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={(e) => setIsOnline(e.target.checked)}
            className="rounded border-white/20"
          />
          Online event
        </label>
        {!isOnline && (
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
          />
        )}
        {isOnline && (
          <input
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="Meeting URL (Zoom, Meet, etc.)"
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
          />
        )}
        <button
          type="button"
          disabled={pending || !title.trim() || !startsAt}
          onClick={() =>
            startTransition(async () => {
              try {
                const result = await createAtlasEventAction({
                  title: title.trim(),
                  description: description.trim() || undefined,
                  startsAt: new Date(startsAt).toISOString(),
                  endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
                  location: isOnline ? undefined : location.trim() || undefined,
                  isOnline,
                  meetingUrl: isOnline && meetingUrl.trim() ? meetingUrl.trim() : undefined,
                });
                toast.success("Event created");
                router.push(`/atlas/events/${result.eventId}`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to create event");
              }
            })
          }
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-background font-medium disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish Event
        </button>
      </div>
    </div>
  );
}
