import { Wallet } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantWalletSummary } from "@/modules/wallet/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { formatDateTime } from "@/utils/format";
import { CurrencyAmount, UsdAmount } from "@/components/payments/CurrencyAmount";
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

export default async function MerchantWalletPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [summary, store] = await Promise.all([
    getMerchantWalletSummary(profile.id),
    getMerchantStore(profile.id),
  ]);

  const primaryWallet = summary.wallets.find((w) => w.is_primary) ?? summary.wallets[0];

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Wallet"
        headingClassName="text-gold"
        description="Payout address and transaction history"
      />

      <DashboardStats columns={3}>
        <DashboardStat
          label="Total revenue"
          value={<UsdAmount amount={Number(summary.profile?.total_revenue_usd ?? 0)} size={20} />}
        />
        <DashboardStat label="Total orders" value={String(summary.profile?.total_orders ?? 0)} />
        <DashboardStat
          label="Payout wallet"
          value={store?.wallet_address ? "Configured" : "Missing"}
          tone={store?.wallet_address ? "success" : "warning"}
        />
      </DashboardStats>

      <DashboardSection title="Payout address" level="h3">
        <DashboardCard>
          <p className="break-all font-mono text-sm">{store?.wallet_address ?? "Not configured"}</p>
          {primaryWallet?.address && primaryWallet.address !== store?.wallet_address && (
            <p className="mt-2 break-all text-sm text-muted">
              Ledger wallet: {primaryWallet.address}
            </p>
          )}
        </DashboardCard>
      </DashboardSection>

      <DashboardSection title="Transactions" level="h3">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Wallet transactions" minWidth="38rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Type</DashboardTableHeader>
                <DashboardTableHeader>Amount</DashboardTableHeader>
                <DashboardTableHeader>Status</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">Date</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {summary.transactions.length === 0 ? (
                <DashboardTableEmpty colSpan={4}>
                  <DashboardEmptyState
                    inset
                    icon={<Wallet className="h-5 w-5" aria-hidden />}
                    title="No wallet transactions yet"
                    description="Settlements and payouts will be recorded here."
                  />
                </DashboardTableEmpty>
              ) : (
                summary.transactions.map((tx) => (
                  <DashboardTableRow key={tx.id} interactive>
                    <DashboardTableCell className="capitalize">
                      {tx.tx_type.replace("_", " ")}
                    </DashboardTableCell>
                    <DashboardTableCell>
                      <CurrencyAmount amount={Number(tx.amount)} currency={tx.currency} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell className="capitalize">{tx.status}</DashboardTableCell>
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
