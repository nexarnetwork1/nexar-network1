import { requireRole } from "@/modules/users/repository";
import { runSystemHealthChecks } from "@/lib/monitoring/system-health";
import { SystemHealthPanel } from "@/components/admin/SystemHealthPanel";

export default async function AdminSystemHealthPage() {
  await requireRole(["admin"]);
  const health = await runSystemHealthChecks();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">System Health</h1>
      <p className="mt-2 text-muted">API, database, realtime, blockchain, treasury, and queue status.</p>
      <div className="mt-8">
        <SystemHealthPanel health={health} />
      </div>
    </div>
  );
}
