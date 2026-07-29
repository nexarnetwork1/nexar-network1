"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/users/repository";
import type { ActionResult } from "@/modules/auth/actions";
import type { ReportTarget } from "@/types";

export async function reportContentAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["customer", "merchant", "admin"]);

  const targetType = formData.get("targetType") as ReportTarget;
  const targetId = formData.get("targetId") as string;
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!targetType || !targetId || !reason) {
    return { success: false, error: "Missing report details" };
  }

  const supabase = await createClient();
  const profile = await requireRole(["customer", "merchant", "admin"]);

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: profile.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details || null,
    status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
