"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contactMessageSchema } from "./validators";
import type { ActionResult } from "@/modules/auth/actions";
import type { ContactMessage, ContactMessageStatus } from "@/types";

export async function submitContactMessageAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = contactMessageSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: (formData.get("website") as string | null) ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (formData.get("website")) {
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    user_id: user?.id ?? null,
  });

  if (error) {
    return { success: false, error: "Could not send message. Please try again." };
  }

  return { success: true };
}

export async function updateContactMessageStatusAction(
  messageId: string,
  status: ContactMessageStatus
): Promise<ActionResult> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_messages")
    .update({ status })
    .eq("id", messageId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getContactMessages(limit = 50): Promise<ContactMessage[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as ContactMessage[];
}

export async function markContactMessageReadAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await updateContactMessageStatusAction(id, "read");
}

export async function archiveContactMessageAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await updateContactMessageStatusAction(id, "archived");
}
