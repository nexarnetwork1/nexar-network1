import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerWalletSummary } from "@/modules/wallet/repository";
import { formatDateTime } from "@/utils/format";
import { CurrencyAmount, UsdAmount } from "@/components/payments/CurrencyAmount";

export default async function CustomerWalletPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/customer/wallet" }));

  const { profile: customerProfile, wallets, transactions } =
    await getCustomerWalletSummary(profile.id);

  const totalSpent = Number(customerProfile?.total_spent_usd ?? 0);
  const totalOrders = customerProfile?.total_orders ?? 0;
  const primaryWallet = wallets.find((w) => w.is_primary) ?? wallets[0];

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Wallet</h1>
      <p className="mt-2 text-muted">Your connected BSC wallet and purchase history</p>

      <dl className="mt-8 max-w-lg space-y-4 rounded-2xl border border-border bg-card/40 p-6">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Wallet address</dt>
          <dd className="mt-1 break-all font-mono text-sm text-gold-secondary">
            {profile.wallet_address ?? primaryWallet?.address ?? "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Total spent</dt>
          <dd className="mt-1 font-heading text-2xl text-gold">
            <UsdAmount amount={totalSpent} size={24} amountClassName="font-heading text-2xl text-gold" />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Completed orders</dt>
          <dd className="mt-1">{totalOrders}</dd>
        </div>
      </dl>

      <h2 className="mt-10 font-heading text-lg font-semibold">Recent transactions</h2>
      <ul className="mt-4 space-y-2">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium capitalize">{tx.tx_type.replace(/_/g, " ")}</p>
              <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono">
              <CurrencyAmount amount={Number(tx.amount)} currency={tx.currency} decimals={4} size={16} />
              </p>
              <p className="text-xs capitalize text-muted">{tx.status}</p>
            </div>
          </li>
        ))}
        {transactions.length === 0 && (
          <li className="text-muted">No wallet transactions yet.</li>
        )}
      </ul>
    </div>
  );
}
