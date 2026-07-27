"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, requireSuperAdmin } from "@/modules/users/repository";
import { dispatchNotification } from "@/modules/notifications/dispatch";
import type { ActionResult } from "@/modules/auth/actions";
import type { ReportTarget } from "@/types";

export async function reportContentAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["customer", "merchant"]);
  const targetType = formData.get("targetType") as ReportTarget;
  const targetId = formData.get("targetId");
  const reason = formData.get("reason");
  const details = formData.get("details");

  if (typeof targetId !== "string" || typeof reason !== "string" || !targetType) {
    return { success: false, error: "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: profile.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: typeof details === "string" ? details : null,
  });

  if (error) return { success: false, error: error.message };

  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");

  await Promise.all(
    (admins ?? []).map((admin) =>
      dispatchNotification({
        event: "content_report",
        userId: admin.id,
        type: "security",
        title: "New content report",
        body: `A ${targetType.replace("_", " ")} was reported: ${reason}`,
        metadata: { target_type: targetType, target_id: targetId },
      })
    )
  );

  return { success: true };
}

export async function resolveReportAction(formData: FormData): Promise<ActionResult> {
  await requireSuperAdmin();
  const reportId = formData.get("reportId");
  const status = formData.get("status");

  if (typeof reportId !== "string" || typeof status !== "string") {
    return { success: false, error: "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("content_reports")
    .update({
      status,
      reviewed_by: null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/reports");
  return { success: true };
}
