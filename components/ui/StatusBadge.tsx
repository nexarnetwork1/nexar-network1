import { cn } from "@/lib/utils/cn";

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  paid: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  expired: "text-muted border-border bg-surface/50",
  cancelled: "text-red-400 border-red-400/30 bg-red-400/10",
  refunded: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  processing: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  shipped: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  delivered: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  draft: "text-muted border-border bg-surface/50",
  pending: "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? "text-muted border-border"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
