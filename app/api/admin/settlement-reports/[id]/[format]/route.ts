import { requireRole } from "@/modules/users/repository";
import {
  settlementReportToCsv,
  settlementReportToExcelXml,
  settlementReportToPdfLines,
} from "@/modules/settlement-reports/export";
import { csvResponse } from "@/utils/export/csv";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; format: string }> }
) {
  await requireRole(["admin"]);
  const { id, format } = await context.params;
  const admin = createAdminClient();
  const { data: report } = await admin.from("settlement_reports").select("*").eq("id", id).single();
  if (!report) return Response.json({ error: "Not found" }, { status: 404 });

  if (format === "csv") {
    return csvResponse(settlementReportToCsv(report), `settlement-report-${id}.csv`);
  }
  if (format === "xlsx" || format === "excel") {
    return new Response(settlementReportToExcelXml(report), {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="settlement-report-${id}.xml"`,
      },
    });
  }
  if (format === "pdf") {
    const lines = settlementReportToPdfLines(report).join("\n");
    return new Response(lines, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="settlement-report-${id}.txt"`,
      },
    });
  }

  return Response.json(report);
}
