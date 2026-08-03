import { CreditCard, History, Wallet } from "lucide-react";
import { getAllPaymentSessions, getAllSettlements, getRecentPaymentStatusHistory } from "@/modules/platform/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RetrySettlementsButton } from "@/components/admin/RetrySettlementsButton";
import { ExportButton } from "@/components/admin/ExportButton";
import { formatDateTime } from "@/utils/format";
import { CurrencyAmount, UsdAmount } from "@/components/payments/CurrencyAmount";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import {
  DashboardActions,
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

export default async function AdminPaymentsPage() {
  const [sessions, settlements, statusHistory] = await Promise.all([
    getAllPaymentSessions(),
    getAllSettlements(),
    getRecentPaymentStatusHistory(20),
  ]);

  const failedSettlements = settlements.filter((s) => s.status === "failed");
  const failedPayments = sessions.filter((s) => s.status === "failed");
  const pendingPayments = sessions.filter((s) =>
    ["waiting", "pending", "waiting_confirmation"].includes(s.status)
  );

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Payments"
        description={`${sessions.length} sessions · ${pendingPayments.length} pending · ${failedPayments.length} failed`}
        actions={<ExportButton resource="payments" />}
      />

      <DashboardSection as="section" level="h2" title="Recent sessions">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Recent payment sessions" minWidth="48rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Invoice</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Method</DashboardTableHeader>
                <DashboardTableHeader>Amount</DashboardTableHeader>
                <DashboardTableHeader>Status</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">Created</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {sessions.length === 0 ? (
                <DashboardTableEmpty colSpan={5}>
                  <DashboardEmptyState
                    inset
                    icon={<CreditCard className="h-5 w-5" aria-hidden />}
                    title="No payment sessions"
                    description="Checkout sessions started by customers will be listed here."
                  />
                </DashboardTableEmpty>
              ) : (
                sessions.map((s) => (
                  <DashboardTableRow key={s.id} interactive>
                    <DashboardTableCell className="font-mono text-xs">
                      {(s.invoice as { invoice_number?: string })?.invoice_number ?? "—"}
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="md">
                      <PaymentMethodLogo method={s.method} size={18} />
                    </DashboardTableCell>
                    <DashboardTableCell>
                      <CurrencyAmount amount={Number(s.amount)} currency={s.currency} decimals={6} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell>
                      <StatusBadge status={s.status} />
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="sm" className="text-muted">
                      {new Date(s.created_at).toLocaleString()}
                    </DashboardTableCell>
                  </DashboardTableRow>
                ))
              )}
            </DashboardTableBody>
          </DashboardTable>
        </DashboardCard>
      </DashboardSection>

      <DashboardSection
        as="section"
        level="h2"
        title="Settlements"
        actions={
          <DashboardActions>
            {failedSettlements.length > 0 && (
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300">
                {failedSettlements.length} failed
              </span>
            )}
            <RetrySettlementsButton />
          </DashboardActions>
        }
      >
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Merchant settlements" minWidth="48rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Gross</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Platform fee</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">Merchant</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Rate</DashboardTableHeader>
                <DashboardTableHeader>Status</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {settlements.length === 0 ? (
                <DashboardTableEmpty colSpan={5}>
                  <DashboardEmptyState
                    inset
                    icon={<Wallet className="h-5 w-5" aria-hidden />}
                    title="No settlements yet"
                    description="Settlements are created once payments are confirmed and split."
                  />
                </DashboardTableEmpty>
              ) : (
                settlements.map((s) => (
                  <DashboardTableRow
                    key={s.id}
                    interactive
                    className={s.status === "failed" ? "bg-red-950/30" : undefined}
                  >
                    <DashboardTableCell>
                      <UsdAmount amount={Number(s.gross_amount)} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="md" className="text-gold">
                      <UsdAmount amount={Number(s.platform_fee)} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="sm">
                      <UsdAmount amount={Number(s.merchant_amount)} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="md">
                      {(Number(s.fee_rate_applied) * 100).toFixed(2)}%
                    </DashboardTableCell>
                    <DashboardTableCell>
                      <StatusBadge status={s.status} />
                    </DashboardTableCell>
                  </DashboardTableRow>
                ))
              )}
            </DashboardTableBody>
          </DashboardTable>
        </DashboardCard>
      </DashboardSection>

      <DashboardSection as="section" level="h2" title="Status history">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Recent payment status transitions" minWidth="44rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader hideBelow="md">From</DashboardTableHeader>
                <DashboardTableHeader>To</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Reason</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">When</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {statusHistory.length === 0 ? (
                <DashboardTableEmpty colSpan={4}>
                  <DashboardEmptyState
                    inset
                    icon={<History className="h-5 w-5" aria-hidden />}
                    title="No status transitions yet"
                    description="Payment status changes are recorded here as they happen."
                  />
                </DashboardTableEmpty>
              ) : (
                statusHistory.map((h) => (
                  <DashboardTableRow key={h.id} interactive>
                    <DashboardTableCell hideBelow="md" className="capitalize">
                      {h.from_status ?? "—"}
                    </DashboardTableCell>
                    <DashboardTableCell className="capitalize">{h.to_status}</DashboardTableCell>
                    <DashboardTableCell hideBelow="md" wrap className="text-muted">
                      {h.reason ?? "—"}
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="sm" className="text-muted">
                      {formatDateTime(h.created_at)}
                    </DashboardTableCell>
                  </DashboardTableRow>
                ))
              )}
            </DashboardTableBody>
          </DashboardTable>
        </DashboardCard>
      </DashboardSection>
    </div>
  );
}
