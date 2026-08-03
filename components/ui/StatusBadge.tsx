import { cn } from "@/lib/utils/cn";

/** Status chips stay within the black-gold + semantic success/error system. */
const STATUS_STYLES: Record<string, string> = {
  pending_payment: "text-gold border-gold/30 bg-gold/10",
  paid: "text-success border-success/30 bg-success/10",
  expired: "text-muted border-border bg-surface/50",
  cancelled: "text-error border-error/30 bg-error/10",
  refunded: "text-gold-secondary border-gold-secondary/30 bg-gold-secondary/10",
  processing: "text-gold-accent border-gold-accent/30 bg-gold-accent/10",
  shipped: "text-gold border-gold/25 bg-gold/8",
  delivered: "text-success border-success/30 bg-success/10",
  draft: "text-muted border-border bg-surface/50",
  pending: "text-gold border-gold/30 bg-gold/10",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize tracking-wide",
        STATUS_STYLES[status] ?? "text-muted border-border",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
