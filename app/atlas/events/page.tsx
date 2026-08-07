import { getPastEvents, getUpcomingEvents } from "@/modules/atlas-network/repository";
import { EventsBrowseClient } from "@/components/atlas/events/EventsBrowseClient";

export default async function AtlasEventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ limit: 50 }),
    getPastEvents({ limit: 30 }),
  ]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-sm text-muted mt-1">Business events across the ATLAS network</p>
      </div>
      <EventsBrowseClient initialUpcoming={upcoming} initialPast={past} />
    </div>
  );
}
