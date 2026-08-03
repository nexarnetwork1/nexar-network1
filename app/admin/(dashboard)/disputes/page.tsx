import Link from "next/link";
import { Gavel } from "lucide-react";
import { requireSuperAdmin } from "@/modules/users/repository";
import { getAllDisputes } from "@/modules/disputes/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

export default async function AdminDisputesPage() {
  await requireSuperAdmin();
  const disputes = await getAllDisputes();

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Disputes"
        description="Review and resolve customer–merchant disputes."
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Open and resolved disputes" minWidth="48rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Order</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Reason</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Created</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {disputes.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<Gavel className="h-5 w-5" aria-hidden />}
                  title="No disputes"
                  description="Disputes raised between customers and merchants will show up here."
                />
              </DashboardTableEmpty>
            ) : (
              disputes.map((d) => (
                <DashboardTableRow key={d.id} interactive>
                  <DashboardTableCell className="font-mono text-xs">
                    {d.order_id.slice(0, 8)}…
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <StatusBadge status={d.status} />
                  </DashboardTableCell>
                  <DashboardTableCell wrap hideBelow="md" className="max-w-[24rem] text-muted">
                    {d.reason.slice(0, 80)}
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="sm" className="text-muted">
                    {new Date(d.created_at).toLocaleDateString()}
                  </DashboardTableCell>
                  <DashboardTableCell align="right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/admin/disputes/${d.id}`}
                        className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-gold transition-colors hover:text-gold-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                      >
                        Review
                      </Link>
                    </div>
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
