"use client";

import Link from "next/link";
import { Calendar, Globe, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { NetworkEvent } from "@/modules/atlas-network/types";
import { cn } from "@/lib/utils/cn";

type EventCardProps = {
  event: NetworkEvent & { profile?: { display_name?: string; slug?: string } | null };
  compact?: boolean;
};

export function EventCard({ event, compact }: EventCardProps) {
  const meetingUrl =
    typeof event.metadata?.meeting_url === "string" ? event.metadata.meeting_url : null;

  return (
    <Link
      href={`/atlas/events/${event.id}`}
      className={cn(
        "block rounded-xl border border-white/10 bg-white/5 hover:border-gold/25 transition-colors",
        compact ? "p-3" : "p-4",
      )}
    >
      <h3 className={cn("font-semibold line-clamp-2", compact ? "text-sm" : "text-base")}>
        {event.title}
      </h3>
      {event.profile?.display_name && (
        <p className="text-xs text-muted mt-1">{event.profile.display_name}</p>
      )}
      <p className="text-sm text-muted mt-2 flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        {format(new Date(event.starts_at), "EEE, MMM d · h:mm a")}
      </p>
      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted">
        {event.is_online ? (
          <span className="inline-flex items-center gap-1 text-gold">
            <Globe className="h-3 w-3" />
            Online{meetingUrl ? " · Join link available" : ""}
          </span>
        ) : event.location ? (
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {event.location}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
