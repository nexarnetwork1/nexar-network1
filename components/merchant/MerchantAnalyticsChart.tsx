"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS } from "@/lib/constants/design";

type MerchantAnalyticsChartProps = {
  data: Array<{ date: string; revenue: number }>;
};

export function MerchantAnalyticsChart({ data }: MerchantAnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <p className="mt-4 nxr-card p-8 text-center text-muted">
        No revenue data yet.
      </p>
    );
  }

  return (
    <div className="mt-4 h-72 nxr-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [
              `$${Number(value ?? 0).toFixed(2)}`,
              "Revenue",
            ]}
          />
          <Bar dataKey="revenue" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
