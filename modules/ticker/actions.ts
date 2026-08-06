"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/modules/users/repository";
import { writeAuditLog } from "@/modules/audit/repository";
import {
  createTickerAnnouncement,
  deleteTickerAnnouncement,
  reorderTickerAnnouncements,
  setTickerAnnouncementEnabled,
  updateTickerAnnouncement,
} from "./repository";
import { reorderTickerSchema, tickerAnnouncementSchema } from "./validators";
import type { ActionResult } from "@/modules/auth/actions";

function parseOptionalDate(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  return raw ? new Date(raw).toISOString() : null;
}

function revalidateTickerPaths() {
  revalidatePath("/");
  revalidatePath("/admin/news-ticker");
}

export async function createTickerAnnouncementAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSuperAdmin();

  const parsed = tickerAnnouncementSchema.safeParse({
    message: formData.get("message"),
    isEnabled: formData.get("isEnabled") === "true",
    priority: formData.get("priority") ?? 0,
    startsAt: formData.get("startsAt") || null,
    endsAt: formData.get("endsAt") || null,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createTickerAnnouncement({
    message: parsed.data.message,
    isEnabled: parsed.data.isEnabled,
    priority: parsed.data.priority,
    startsAt: parseOptionalDate(formData.get("startsAt")),
    endsAt: parseOptionalDate(formData.get("endsAt")),
  });

  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: session.userId,
    actorRole: session.isPlatformOwner ? "platform_owner" : "admin",
    action: "ticker.created",
    entityType: "ticker_announcement",
    entityId: result.id,
    metadata: {
      hq_role: session.staffRole,
      is_platform_owner: session.isPlatformOwner,
    },
  });

  revalidateTickerPaths();
  return { success: true };
}

export async function updateTickerAnnouncementAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSuperAdmin();

  const parsed = tickerAnnouncementSchema.safeParse({
    message: formData.get("message"),
    isEnabled: formData.get("isEnabled") === "true",
    priority: formData.get("priority") ?? 0,
    startsAt: formData.get("startsAt") || null,
    endsAt: formData.get("endsAt") || null,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateTickerAnnouncement(id, {
    message: parsed.data.message,
    isEnabled: parsed.data.isEnabled,
    priority: parsed.data.priority,
    startsAt: parseOptionalDate(formData.get("startsAt")),
    endsAt: parseOptionalDate(formData.get("endsAt")),
  });

  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: session.userId,
    actorRole: session.isPlatformOwner ? "platform_owner" : "admin",
    action: "ticker.updated",
    entityType: "ticker_announcement",
    entityId: id,
    metadata: {
      hq_role: session.staffRole,
      is_platform_owner: session.isPlatformOwner,
    },
  });

  revalidateTickerPaths();
  return { success: true };
}

export async function deleteTickerAnnouncementAction(id: string): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  const result = await deleteTickerAnnouncement(id);
  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: session.userId,
    actorRole: session.isPlatformOwner ? "platform_owner" : "admin",
    action: "ticker.deleted",
    entityType: "ticker_announcement",
    entityId: id,
    metadata: {
      hq_role: session.staffRole,
      is_platform_owner: session.isPlatformOwner,
    },
  });

  revalidateTickerPaths();
  return { success: true };
}

export async function toggleTickerAnnouncementAction(
  id: string,
  isEnabled: boolean
): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  const result = await setTickerAnnouncementEnabled(id, isEnabled);
  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: session.userId,
    actorRole: session.isPlatformOwner ? "platform_owner" : "admin",
    action: isEnabled ? "ticker.enabled" : "ticker.disabled",
    entityType: "ticker_announcement",
    entityId: id,
    metadata: {
      hq_role: session.staffRole,
      is_platform_owner: session.isPlatformOwner,
    },
  });

  revalidateTickerPaths();
  return { success: true };
}

export async function reorderTickerAnnouncementsAction(
  orderedIds: string[]
): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  const parsed = reorderTickerSchema.safeParse({ orderedIds });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid order" };
  }

  const result = await reorderTickerAnnouncements(parsed.data.orderedIds);
  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: session.userId,
    actorRole: session.isPlatformOwner ? "platform_owner" : "admin",
    action: "ticker.reordered",
    entityType: "ticker_announcement",
    metadata: {
      hq_role: session.staffRole,
      is_platform_owner: session.isPlatformOwner,
      ordered_ids: orderedIds,
    },
  });

  revalidateTickerPaths();
  return { success: true };
}
