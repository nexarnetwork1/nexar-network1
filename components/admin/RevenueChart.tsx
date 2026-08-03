"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyRevenue } from "@/modules/analytics/repository";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

type RevenueChartProps = {
  data: MonthlyRevenue[];
};

// Matches --nxr-gold and --nxr-gold-secondary; recharts needs literal colours.
const REVENUE_FILL = "#d4af37";
const FEES_FILL = "#8a7124";

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <DashboardEmptyState
        title="No revenue data yet"
        description="Monthly revenue appears here once orders start settling."
      />
    );
  }

  const chartData = data.map((d) => ({
    month: d.month,
    Revenue: Math.round(d.revenue * 100) / 100,
    Fees: Math.round(d.fees * 100) / 100,
  }));

  return (
    <div className="h-72 rounded-2xl border border-border bg-card/40 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis dataKey="month" stroke="#9a9a9a" fontSize={12} />
          <YAxis stroke="#9a9a9a" fontSize={12} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              backgroundColor: "#0b0b0b",
              border: "1px solid #1a1a1a",
              borderRadius: "12px",
              color: "#ffffff",
            }}
          />
          <Legend />
          <Bar dataKey="Revenue" fill={REVENUE_FILL} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Fees" fill={FEES_FILL} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
