import { redirect } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";

import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerWalletSummary } from "@/modules/wallet/repository";
import { formatDateTime } from "@/utils/format";
import { CurrencyAmount, UsdAmount } from "@/components/payments/CurrencyAmount";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
} from "@/components/dashboard";

export default async function CustomerWalletPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/customer/wallet");
}

  const { profile: customerProfile, wallets, transactions } =
    await getCustomerWalletSummary(profile.id);

  const totalSpent = Number(customerProfile?.total_spent_usd ?? 0);
  const totalOrders = customerProfile?.total_orders ?? 0;
  const primaryWallet = wallets.find((w) => w.is_primary) ?? wallets[0];

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Wallet"
        description="Your connected BSC wallet and purchase history"
      />

      <DashboardStats columns={2}>
        <DashboardStat
          label="Total spent"
          tone="gold"
          value={<UsdAmount amount={totalSpent} size={20} />}
        />
        <DashboardStat label="Completed orders" value={totalOrders} />
      </DashboardStats>

      <DashboardCard>
        <dl>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Wallet address
          </dt>
          <dd className="mt-2 break-all font-mono text-sm text-gold-secondary">
            {profile.wallet_address ?? primaryWallet?.address ?? "Not set"}
          </dd>
        </dl>
      </DashboardCard>

      <DashboardSection title="Recent transactions" level="h3">
        {transactions.length === 0 ? (
          <DashboardEmptyState
            icon={<ArrowLeftRight className="h-6 w-6" aria-hidden />}
            title="No wallet transactions yet"
            description="Payments, refunds and transfers on your wallet will be listed here."
          />
        ) : (
          <ul className="space-y-3">
            {transactions.map((tx) => (
              <DashboardCard
                as="li"
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium capitalize text-white">
                    {tx.tx_type.replace(/_/g, " ")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{formatDateTime(tx.created_at)}</p>
                </div>
                <div className="min-w-0 sm:text-right">
                  <p className="break-all font-mono text-sm">
                    <CurrencyAmount
                      amount={Number(tx.amount)}
                      currency={tx.currency}
                      decimals={4}
                      size={16}
                    />
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-muted">{tx.status}</p>
                </div>
              </DashboardCard>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
