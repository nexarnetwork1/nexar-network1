import { Landmark } from "lucide-react";
import { getTreasurySummary } from "@/modules/platform/repository";
import { getPlatformSettings } from "@/modules/platform/repository";
import { ExportButton } from "@/components/admin/ExportButton";
import { formatDateTime } from "@/utils/format";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

export default async function AdminTreasuryPage() {
  const [summary, settings] = await Promise.all([
    getTreasurySummary(),
    getPlatformSettings(),
  ]);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Treasury wallet"
        headingClassName="text-gold"
        description="Platform fee collection — address and transaction history only. Private keys are never exposed."
        actions={<ExportButton resource="treasury" />}
      />

      <DashboardStats columns={3}>
        <DashboardStat
          label="Treasury address"
          value={summary.address ? `${summary.address.slice(0, 10)}…${summary.address.slice(-8)}` : "Not configured"}
          hint={summary.address ?? undefined}
        />
        <DashboardStat
          label="Total platform fees"
          value={<UsdAmount amount={summary.totalFees} />}
          tone="warning"
        />
        <DashboardStat label="Ledger entries" value={summary.transactions.length} />
      </DashboardStats>

      {settings?.treasury_wallet_address && (
        <p className="rounded-xl border border-border bg-gold/5 px-4 py-3 text-sm text-white/80">
          Configured via platform settings. Update in{" "}
          <a
            href="/admin/platform-fees"
            className="rounded text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            Platform Fees
          </a>
          .
        </p>
      )}

      <DashboardSection title="Fee collection transactions" level="h3">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Treasury fee collection transactions" minWidth="48rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Type</DashboardTableHeader>
                <DashboardTableHeader>Amount</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Currency</DashboardTableHeader>
                <DashboardTableHeader>Status</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Tx hash</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">Date</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {summary.transactions.length === 0 ? (
                <DashboardTableEmpty colSpan={6}>
                  <DashboardEmptyState
                    inset
                    icon={<Landmark className="h-5 w-5" aria-hidden />}
                    title="No treasury transactions yet"
                    description="Platform fees collected from settled orders will be listed here."
                  />
                </DashboardTableEmpty>
              ) : (
                summary.transactions.map((tx) => (
                  <DashboardTableRow key={tx.id} interactive>
                    <DashboardTableCell className="capitalize">
                      {tx.tx_type.replace("_", " ")}
                    </DashboardTableCell>
                    <DashboardTableCell>
                      <UsdAmount amount={Number(tx.amount)} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="md">
                      <CurrencyLogo code={tx.currency} size={18} showLabel />
                    </DashboardTableCell>
                    <DashboardTableCell className="capitalize">{tx.status}</DashboardTableCell>
                    <DashboardTableCell hideBelow="md" className="max-w-[12rem] truncate font-mono text-xs">
                      {tx.tx_hash ?? "—"}
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="sm" className="text-muted">
                      {formatDateTime(tx.created_at)}
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
