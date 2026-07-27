"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/modules/users/repository";
import { markNotificationRead } from "./repository";

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const profile = await getCurrentProfile();
  if (!profile) return;

  await markNotificationRead(id, profile.id);
  revalidatePath("/customer/notifications");
}
