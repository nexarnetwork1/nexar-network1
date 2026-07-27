import { toCsv } from "@/utils/export/csv";
import type { SettlementReport } from "@/types";

export function settlementReportToCsv(report: SettlementReport): string {
  const m = report.metrics;
  return toCsv(
    [
      {
        period: `${report.period_start} – ${report.period_end}`,
        gross_revenue: m.gross_revenue,
        platform_fees: m.platform_fees,
        net_revenue: m.net_revenue,
        refunds: m.refunds,
        escrow_balance: m.escrow_balance,
        completed_orders: m.completed_orders,
        failed_payments: m.failed_payments,
      },
    ],
    [
      { key: "period", label: "Period" },
      { key: "gross_revenue", label: "Gross Revenue" },
      { key: "platform_fees", label: "Platform Fees" },
      { key: "net_revenue", label: "Net Revenue" },
      { key: "refunds", label: "Refunds" },
      { key: "escrow_balance", label: "Escrow Balance" },
      { key: "completed_orders", label: "Completed Orders" },
      { key: "failed_payments", label: "Failed Payments" },
    ]
  );
}

export function settlementReportToExcelXml(report: SettlementReport): string {
  const m = report.metrics;
  const rows = [
    ["Period", `${report.period_start} – ${report.period_end}`],
    ["Gross Revenue", m.gross_revenue],
    ["Platform Fees", m.platform_fees],
    ["Net Revenue", m.net_revenue],
    ["Refunds", m.refunds],
    ["Escrow Balance", m.escrow_balance],
    ["Completed Orders", m.completed_orders],
    ["Failed Payments", m.failed_payments],
  ];
  const body = rows.map(([a, b]) => `<Row><Cell><Data>${a}</Data></Cell><Cell><Data>${b}</Data></Cell></Row>`).join("");
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Report"><Table>${body}</Table></Worksheet></Workbook>`;
}

export function settlementReportToPdfLines(report: SettlementReport): string[] {
  const m = report.metrics;
  return [
    `Settlement Report (${report.period_type})`,
    `Period: ${report.period_start} – ${report.period_end}`,
    `Gross Revenue: $${m.gross_revenue.toFixed(2)}`,
    `Platform Fees: $${m.platform_fees.toFixed(2)}`,
    `Net Revenue: $${m.net_revenue.toFixed(2)}`,
    `Refunds: $${m.refunds.toFixed(2)}`,
    `Escrow Balance: $${m.escrow_balance.toFixed(2)}`,
    `Completed Orders: ${m.completed_orders}`,
    `Failed Payments: ${m.failed_payments}`,
  ];
}
