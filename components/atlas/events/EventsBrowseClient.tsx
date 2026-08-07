"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Globe, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { NetworkEvent } from "@/modules/atlas-network/types";
import { fetchEventsAction } from "@/modules/atlas-network/actions";
import { EventCard } from "./EventCard";

type EventsBrowseClientProps = {
  initialUpcoming: (NetworkEvent & { profile?: { display_name?: string; slug?: string } | null })[];
  initialPast: (NetworkEvent & { profile?: { display_name?: string; slug?: string } | null })[];
};

export function EventsBrowseClient({ initialUpcoming, initialPast }: EventsBrowseClientProps) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [filter, setFilter] = useState<"all" | "online" | "physical">("all");
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [past, setPast] = useState(initialPast);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const events = tab === "upcoming" ? upcoming : past;
  const filtered = events.filter((e) => {
    if (filter === "online") return e.is_online;
    if (filter === "physical") return !e.is_online;
    return true;
  });

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const eventsByDay = new Map<string, typeof upcoming>();
  for (const event of upcoming) {
    const key = format(new Date(event.starts_at), "yyyy-MM-dd");
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(event);
  }

  const runSearch = () => {
    startTransition(async () => {
      try {
        const result = await fetchEventsAction({
          query: query.trim() || undefined,
          upcomingOnly: tab === "upcoming",
          onlineOnly: filter === "online",
          physicalOnly: filter === "physical",
          limit: 50,
        });
        if (tab === "upcoming") setUpcoming(result.events);
        else setPast(result.events);
      } catch {
        /* keep */
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm capitalize",
                tab === t ? "bg-gold/15 text-gold" : "text-muted hover:text-white",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <Link
          href="/atlas/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-background text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events..."
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
        />
        {(["all", "online", "physical"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm border capitalize",
              filter === f
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-white/10 text-muted",
            )}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {tab === "upcoming" && (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" />
              {format(calendarMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                className="p-1.5 rounded-lg hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonth(new Date())}
                className="px-2 py-1 text-xs text-gold"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                className="p-1.5 rounded-lg hover:bg-white/5"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
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
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[3.5rem] p-1 rounded-lg border text-left",
                    isToday ? "border-gold/40 bg-gold/5" : "border-white/5 bg-black/20",
                    !isSameMonth(day, calendarMonth) && "opacity-40",
                  )}
                >
                  <span className={cn("text-xs", isToday ? "text-gold font-semibold" : "text-muted")}>
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
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4 capitalize">{tab} Events</h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">No events found.</p>
        ) : (
          <div className={cn("grid gap-3 sm:grid-cols-2", pending && "opacity-60")}>
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
