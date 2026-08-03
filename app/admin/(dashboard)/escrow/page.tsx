import { Landmark } from "lucide-react";
import { requireSuperAdmin } from "@/modules/users/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseEscrowAction } from "@/modules/escrow/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
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
import type { Escrow } from "@/types";

export default async function AdminEscrowPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("escrows").select("*").order("created_at", { ascending: false }).limit(100);
  const escrows = (data ?? []) as Escrow[];

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Escrow"
        description="Funds held until release conditions are met."
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Escrow holdings" minWidth="48rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Order</DashboardTableHeader>
              <DashboardTableHeader>Amount</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Held</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {escrows.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<Landmark className="h-5 w-5" aria-hidden />}
                  title="No escrow records"
                  description="Escrows appear here once an order holds funds for release."
                />
              </DashboardTableEmpty>
            ) : (
              escrows.map((e) => (
                <DashboardTableRow key={e.id} interactive>
                  <DashboardTableCell className="font-mono text-xs">
                    {e.order_id.slice(0, 8)}…
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <CurrencyAmount amount={Number(e.amount)} currency={e.currency} size={16} />
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <StatusBadge status={e.status} />
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="sm" className="text-muted">
                    {e.held_at ? new Date(e.held_at).toLocaleString() : "—"}
                  </DashboardTableCell>
                  <DashboardTableCell align="right">
                    {e.status === "held" ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <form
                          action={async () => {
                            "use server";
                            await releaseEscrowAction(e.id, "admin_release");
                          }}
                        >
                          <Button type="submit">Release</Button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
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
