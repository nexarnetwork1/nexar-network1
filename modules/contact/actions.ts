"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { contactMessageSchema } from "./validators";
import { sendEmail } from "@/lib/email/send";
import type { ActionResult } from "@/modules/auth/actions";
import type { ContactMessage, ContactMessageStatus } from "@/types";

const CONTACT_INBOX = "admin@nexarnetwork.org";

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

  let userId: string | null = null;
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    // Auth not available — still deliver via email
  }

  const admin = tryCreateAdminClient();
  if (admin) {
    const { error } = await admin.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      user_id: userId,
    });

    if (error) {
      console.error("[contact] insert failed", error.message);
    }
  }

  const html = `
    <h2>New contact message</h2>
    <p><strong>From:</strong> ${escapeHtml(parsed.data.name)} &lt;${escapeHtml(parsed.data.email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(parsed.data.subject)}</p>
    <hr />
    <p>${escapeHtml(parsed.data.message).replace(/\n/g, "<br />")}</p>
  `;

  const emailResult = await sendEmail({
    to: CONTACT_INBOX,
    subject: `[Nexar Contact] ${parsed.data.subject}`,
    html,
    text: `From: ${parsed.data.name} <${parsed.data.email}>\nSubject: ${parsed.data.subject}\n\n${parsed.data.message}`,
  });

  if (!emailResult.success && !admin) {
    return {
      success: false,
      error: "Could not send message. Email service is not configured.",
    };
  }

  return { success: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function updateContactMessageStatusAction(
  messageId: string,
  status: ContactMessageStatus
): Promise<ActionResult> {
  const admin = tryCreateAdminClient();
  if (!admin) return { success: false, error: "Admin database not configured" };

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
  const admin = tryCreateAdminClient();
  if (!admin) return [];

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
