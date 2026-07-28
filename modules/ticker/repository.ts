import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { TickerAnnouncement } from "@/types";

const DEFAULT_TICKER: TickerAnnouncement[] = [];

function parseAnnouncement(row: Record<string, unknown>): TickerAnnouncement {
  return {
    id: row.id as string,
    message: row.message as string,
    is_enabled: row.is_enabled as boolean,
    sort_order: row.sort_order as number,
    priority: row.priority as number,
    starts_at: (row.starts_at as string | null) ?? null,
    ends_at: (row.ends_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/** Active announcements for the public ticker (respects schedule + enabled). */
export async function getActiveTickerAnnouncements(): Promise<TickerAnnouncement[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticker_announcements")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[ticker] announcements unavailable:", error.message);
      }
      return DEFAULT_TICKER;
    }

    return (data ?? []).map(parseAnnouncement);
  } catch {
    return DEFAULT_TICKER;
  }
}

/** All announcements for admin management (includes disabled + scheduled). */
export async function getAllTickerAnnouncementsAdmin(): Promise<TickerAnnouncement[]> {
  const admin = tryCreateAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("ticker_announcements")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []).map(parseAnnouncement);
}

export async function createTickerAnnouncement(input: {
  message: string;
  isEnabled: boolean;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
}): Promise<{ id?: string; error?: string }> {
  const admin = tryCreateAdminClient();
  if (!admin) return { error: "Admin database not configured" };

  const { data: maxRow } = await admin
    .from("ticker_announcements")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from("ticker_announcements")
    .insert({
      message: input.message,
      is_enabled: input.isEnabled,
      priority: input.priority,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateTickerAnnouncement(
  id: string,
  input: {
    message: string;
    isEnabled: boolean;
    priority: number;
    startsAt: string | null;
    endsAt: string | null;
  }
): Promise<{ error?: string }> {
  const admin = tryCreateAdminClient();
  if (!admin) return { error: "Admin database not configured" };

  const { error } = await admin
    .from("ticker_announcements")
    .update({
      message: input.message,
      is_enabled: input.isEnabled,
      priority: input.priority,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteTickerAnnouncement(id: string): Promise<{ error?: string }> {
  const admin = tryCreateAdminClient();
  if (!admin) return { error: "Admin database not configured" };

  const { error } = await admin.from("ticker_announcements").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function setTickerAnnouncementEnabled(
  id: string,
  isEnabled: boolean
): Promise<{ error?: string }> {
  const admin = tryCreateAdminClient();
  if (!admin) return { error: "Admin database not configured" };

  const { error } = await admin
    .from("ticker_announcements")
    .update({ is_enabled: isEnabled })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function reorderTickerAnnouncements(
  orderedIds: string[]
): Promise<{ error?: string }> {
  const admin = tryCreateAdminClient();
  if (!admin) return { error: "Admin database not configured" };

  const updates = orderedIds.map((id, index) =>
    admin.from("ticker_announcements").update({ sort_order: index }).eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };
  return {};
}
