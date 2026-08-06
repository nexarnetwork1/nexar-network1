import { cn } from "@/lib/utils/cn";

interface PremiumStatsProps {
  stats: Array<{
    label: string;
    value: string;
    description?: string;
    trend?: "up" | "down" | "neutral";
  }>;
  className?: string;
}

export function PremiumStats({ stats, className }: PremiumStatsProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {stats.map((stat, index) => (
        <div key={index} className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <p className="text-sm font-medium text-muted uppercase tracking-wider mb-2">
            {stat.label}
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</p>
          {stat.description && (
            <p className="text-sm text-muted">{stat.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
