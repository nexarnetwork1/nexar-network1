import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Calendar, MapPin, Globe } from "lucide-react";
import { format } from "date-fns";
import {
  getEventById,
  getPersonProfileByUserId,
  hasUserRegisteredForEvent,
} from "@/modules/atlas-network/repository";
import { EventRegisterForm } from "@/components/atlas/app/EventRegisterForm";

export default async function AtlasEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const registrations =
    (event.metadata.registrations as Array<{ profile_id: string }>) ?? [];
  const meetingUrl =
    typeof event.metadata.meeting_url === "string" ? event.metadata.meeting_url : null;

  const session = await auth();
  let alreadyRegistered = false;
  if (session?.user?.id) {
    const person = await getPersonProfileByUserId(session.user.id);
    if (person) {
      alreadyRegistered = await hasUserRegisteredForEvent(id, person.network_profile_id);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <Link href="/atlas/events" className="text-sm text-muted hover:text-gold">
        ← Back to Events
      </Link>

      <article className="p-6 rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            {event.profile && (
              <Link
                href={`/atlas/network/${event.profile.slug}`}
                className="text-sm text-muted mt-1 hover:text-gold"
              >
                Hosted by {event.profile.display_name}
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted mb-4">
          <p>
            {format(new Date(event.starts_at), "EEEE, MMMM d, yyyy · h:mm a")}
            {event.ends_at && ` – ${format(new Date(event.ends_at), "h:mm a")}`}
          </p>
          {event.is_online ? (
            <p className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Online event
            </p>
          ) : event.location ? (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.location}
            </p>
          ) : null}
          <p>{registrations.length} registered</p>
        </div>

        {event.description && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
        )}
      </article>

      <EventRegisterForm
        eventId={event.id}
        initialRegistered={alreadyRegistered}
        meetingUrl={meetingUrl}
      />
    </div>
  );
}
