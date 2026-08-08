import type { SystemHealthSnapshot } from "@/lib/monitoring/system-health";

const STATUS_COLORS = {
  ok: "text-success",
  warn: "text-gold",
  error: "text-red-400",
};

export function SystemHealthPanel({ health }: { health: SystemHealthSnapshot }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface/50 p-6">
        <p className="text-sm text-muted">Overall status</p>
        <p className="text-2xl font-semibold capitalize text-white">{health.status}</p>
        <p className="mt-1 text-xs text-muted">{health.timestamp}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(health.checks).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-border bg-surface/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{key.replace(/_/g, " ")}</p>
            <p className={`mt-1 font-semibold uppercase ${STATUS_COLORS[value]}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Object.entries(health.metrics).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-border bg-surface/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{key.replace(/_/g, " ")}</p>
            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
