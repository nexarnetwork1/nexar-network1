import { BadgeCheck, Clock, MessageCircle, ShoppingBag, Star, TrendingUp } from "lucide-react";
import type { StoreTrustMetrics } from "@/types";

type StoreTrustBadgesProps = {
  verificationStatus: string | null;
  isTopSeller: boolean;
  isFeatured?: boolean;
  metrics?: Partial<StoreTrustMetrics> | null;
  salesCount?: number;
};

export function StoreTrustBadges({
  verificationStatus,
  isTopSeller,
  isFeatured,
  metrics,
  salesCount = 0,
}: StoreTrustBadgesProps) {
  const yearsActive = metrics?.years_active ?? 0;
  const totalOrders = metrics?.total_orders ?? salesCount;
  const totalReviews = metrics?.total_reviews ?? 0;
  const responseRate = metrics?.response_rate ?? 0;
  const avgResponseHours = metrics?.avg_response_hours;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {verificationStatus === "verified" && (
          <Badge label="Verified Merchant" icon={BadgeCheck} color="emerald" />
        )}
        {isTopSeller && <Badge label="Top Seller" icon={TrendingUp} color="gold" />}
        {isFeatured && <Badge label="Official Store" icon={Star} color="blue" />}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Years active" value={yearsActive > 0 ? `${yearsActive}+` : "< 1"} />
        <Metric label="Total orders" value={totalOrders.toLocaleString()} />
        <Metric label="Reviews" value={totalReviews.toLocaleString()} icon={Star} />
        <Metric
          label="Response rate"
          value={totalReviews > 0 ? `${Math.round(responseRate)}%` : "—"}
          icon={MessageCircle}
        />
        <Metric
          label="Response time"
          value={
            avgResponseHours != null
              ? avgResponseHours < 24
                ? `${Math.round(avgResponseHours)}h`
                : `${Math.round(avgResponseHours / 24)}d`
              : "—"
          }
          icon={Clock}
        />
        <Metric label="Products sold" value={totalOrders.toLocaleString()} icon={ShoppingBag} />
      </dl>
    </div>
  );
}

function Badge({
  label,
  icon: Icon,
  color,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "gold" | "blue";
}) {
  const colors = {
    emerald: "bg-emerald-500/15 text-emerald-400",
    gold: "bg-gold/15 text-gold",
    blue: "bg-blue-500/15 text-blue-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${colors[color]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <dt className="flex items-center gap-1 text-xs text-muted">
        {Icon && <Icon className="h-3 w-3" aria-hidden />}
        {label}
      </dt>
      <dd className="mt-1 font-heading text-lg font-semibold">{value}</dd>
    </div>
  );
}
