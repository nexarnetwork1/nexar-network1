import { DashboardStat } from "@/components/dashboard";

type AdminStatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

/**
 * Admin KPI tile. Kept as its own component because many admin pages import it,
 * but the presentation now comes from the shared dashboard stat so admin,
 * merchant and customer KPIs look identical.
 */
export function AdminStatCard({ label, value, hint, tone = "default" }: AdminStatCardProps) {
  return <DashboardStat label={label} value={value} hint={hint} tone={tone} />;
}
