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

type RevenueChartProps = {
  data: MonthlyRevenue[];
};

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-zinc-500">
        No revenue data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: d.month,
    Revenue: Math.round(d.revenue * 100) / 100,
    Fees: Math.round(d.fees * 100) / 100,
  }));

  return (
    <div className="h-72 rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="month" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="Revenue" fill="#eab308" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Fees" fill="#ca8a04" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
