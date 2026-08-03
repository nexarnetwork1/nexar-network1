import { ScrollText } from "lucide-react";
import { getAuditLogs } from "@/modules/platform/repository";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs(200);

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Audit logs"
        description="Append-only platform activity log"
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Platform audit log entries" minWidth="60rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Time</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Actor</DashboardTableHeader>
              <DashboardTableHeader>Action</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Entity</DashboardTableHeader>
              <DashboardTableHeader hideBelow="lg">Details</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {logs.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<ScrollText className="h-5 w-5" aria-hidden />}
                  title="No activity recorded"
                  description="Administrative and platform events will be listed here as they happen."
                />
              </DashboardTableEmpty>
            ) : (
              logs.map((log) => (
                <DashboardTableRow key={log.id} interactive>
                  <DashboardTableCell className="align-top text-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </DashboardTableCell>
                  <DashboardTableCell wrap hideBelow="sm" className="align-top">
                    {(log.actor as { full_name?: string; email?: string })?.full_name ??
                      (log.actor as { email?: string })?.email ??
                      "System"}
                    {log.actor_role && (
                      <span className="ml-1 text-xs text-muted">({log.actor_role})</span>
                    )}
                  </DashboardTableCell>
                  <DashboardTableCell wrap className="align-top font-mono text-xs">
                    {log.action}
                  </DashboardTableCell>
                  <DashboardTableCell wrap hideBelow="md" className="align-top">
                    <span className="text-muted">{log.entity_type}</span>
                    {log.entity_id && (
                      <span className="ml-1 font-mono text-xs text-muted">
                        {log.entity_id.slice(0, 8)}…
                      </span>
                    )}
                  </DashboardTableCell>
                  <DashboardTableCell
                    wrap
                    hideBelow="lg"
                    className="max-w-[24rem] align-top text-xs text-muted"
                  >
                    <span className="line-clamp-2 break-all">{JSON.stringify(log.metadata)}</span>
                  </DashboardTableCell>
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
