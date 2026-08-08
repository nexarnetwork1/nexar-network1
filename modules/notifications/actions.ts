"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, requireRole } from "@/modules/users/repository";
import { markNotificationRead } from "./repository";
import { updateNotificationPreferenceSchema } from "./validators";
import type { ActionResult } from "@/modules/auth/actions";

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const profile = await getCurrentProfile();
  if (!profile) return;

  await markNotificationRead(id, profile.id);
  revalidatePath("/customer/notifications");
}

export async function updateNotificationPreferenceAction(
  channel: string,
  eventType: string,
  enabled: boolean
): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);
  const parsed = updateNotificationPreferenceSchema.safeParse({
    channel,
    eventType,
    enabled,
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid notification preference" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: profile.id,
      channel: parsed.data.channel,
      event_type: parsed.data.eventType,
      enabled: parsed.data.enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,channel,event_type" }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/customer/profile");
  revalidatePath("/customer/notifications");
  return { success: true };
}
