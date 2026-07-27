import { getAuditLogs } from "@/modules/platform/repository";

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs(200);

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Audit logs</h1>
      <p className="mt-2 text-zinc-400">Append-only platform activity log</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 align-top">
                <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {(log.actor as { full_name?: string; email?: string })?.full_name ??
                    (log.actor as { email?: string })?.email ??
                    "System"}
                  {log.actor_role && (
                    <span className="ml-1 text-xs text-zinc-500">({log.actor_role})</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3">
                  <span className="text-zinc-400">{log.entity_type}</span>
                  {log.entity_id && (
                    <span className="ml-1 font-mono text-xs text-zinc-500">
                      {log.entity_id.slice(0, 8)}…
                    </span>
                  )}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-xs text-zinc-500">
                  {JSON.stringify(log.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
