import Link from "next/link";
import { Calendar, MapPin, Globe, Plus } from "lucide-react";
import { format, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { getUpcomingEvents } from "@/modules/atlas-network/repository";

export default async function AtlasEventsPage() {
  const events = await getUpcomingEvents({ limit: 100 });
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const eventsByDay = new Map<string, typeof events>();
  for (const event of events) {
    const key = format(new Date(event.starts_at), "yyyy-MM-dd");
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(event);
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted mt-1">Upcoming business events on ATLAS</p>
        </div>
        <Link
          href="/atlas/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-background text-sm font-medium hover:bg-gold-secondary"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gold" />
          {format(now, "MMMM yyyy")}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const isToday = isSameDay(day, now);
            return (
              <div
                key={key}
                className={`min-h-[4rem] p-1 rounded-lg border text-left ${
                  isToday ? "border-gold/40 bg-gold/5" : "border-white/5 bg-black/20"
                } ${!isSameMonth(day, now) ? "opacity-40" : ""}`}
              >
                <span className={`text-xs ${isToday ? "text-gold font-semibold" : "text-muted"}`}>
                  {format(day, "d")}
                </span>
                {dayEvents.slice(0, 2).map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/atlas/events/${ev.id}`}
                    className="block mt-0.5 text-[10px] truncate text-gold hover:underline"
                  >
                    {ev.title}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
        {events.length === 0 ? (
          <div className="p-10 rounded-xl border border-white/10 bg-white/5 text-center">
            <Calendar className="h-10 w-10 text-gold/50 mx-auto mb-3" />
            <p className="text-muted">No upcoming events</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/atlas/events/${event.id}`}
                className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/25 transition-colors"
              >
                <h3 className="font-semibold line-clamp-2">{event.title}</h3>
                <p className="text-sm text-muted mt-2">
                  {format(new Date(event.starts_at), "EEE, MMM d · h:mm a")}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                  {event.is_online ? (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Online
                    </span>
                  ) : event.location ? (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {event.location}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
