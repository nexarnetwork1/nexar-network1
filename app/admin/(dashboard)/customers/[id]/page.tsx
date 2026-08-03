import { notFound } from "next/navigation";
import { Receipt, Wallet } from "lucide-react";
import { getCustomerById } from "@/modules/platform/repository";
import { getCustomerWalletSummaryAdmin, getCustomerPurchaseHistoryAdmin } from "@/modules/wallet/repository";
import { banUserAction, resetUserPasswordAction } from "@/modules/platform/actions";
import { formatDateTime } from "@/utils/format";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import { Button } from "@/components/ui/Button";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
} from "@/components/dashboard";

type Props = { params: Promise<{ id: string }> };

async function banFormAction(formData: FormData) {
  "use server";
  await banUserAction(formData.get("userId") as string, formData.get("ban") === "true");
}

async function resetPasswordFormAction(formData: FormData) {
  "use server";
  await resetUserPasswordAction(formData.get("userId") as string);
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const [customer, wallet, purchases] = await Promise.all([
    getCustomerById(id),
    getCustomerWalletSummaryAdmin(id),
    getCustomerPurchaseHistoryAdmin(id, 20),
  ]);

  if (!customer) notFound();

  const cp = customer.customer_profile as {
    total_orders?: number;
    total_spent_usd?: number;
    preferred_currency?: string;
  } | null;

  const transactions = wallet.transactions.slice(0, 10);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title={customer.full_name ?? customer.email}
        headingClassName="text-gold"
        description={customer.email}
      />

      <DashboardStats columns={3}>
        <DashboardStat label="Total orders" value={String(cp?.total_orders ?? 0)} />
        <DashboardStat label="Total spent" value={<UsdAmount amount={Number(cp?.total_spent_usd ?? 0)} />} />
        <DashboardStat
          label="Preferred currency"
          value={<CurrencyLogo code={cp?.preferred_currency ?? "USD"} size={18} showLabel />}
        />
      </DashboardStats>

      <DashboardCard as="section">
        <h2 className="font-heading text-lg font-semibold text-gold">Wallet</h2>
        <p className="mt-2 break-all font-mono text-sm">
          {customer.wallet_address ?? "No wallet linked"}
        </p>
        {transactions.length === 0 ? (
          <DashboardEmptyState
            inset
            icon={<Wallet className="h-5 w-5" aria-hidden />}
            title="No wallet activity"
            description="Deposits, payments and refunds for this customer will show up here."
          />
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-wrap justify-between gap-2 border-b border-border pb-2 last:border-b-0"
              >
                <span className="capitalize">{tx.tx_type.replace("_", " ")}</span>
                <CurrencyAmount amount={Number(tx.amount)} currency={tx.currency} size={16} />
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardCard as="section">
        <h2 className="font-heading text-lg font-semibold text-gold">Purchase history</h2>
        {purchases.length === 0 ? (
          <DashboardEmptyState
            inset
            icon={<Receipt className="h-5 w-5" aria-hidden />}
            title="No purchases yet"
            description="Completed orders will be listed here once this customer checks out."
          />
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {purchases.map((p) => (
              <li key={p.order_id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 truncate">{p.store_name}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <UsdAmount amount={Number(p.total)} size={16} />
                  <span className="text-muted">· {formatDateTime(p.paid_at ?? p.created_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardSection level="h3" title="Customer actions">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <form action={resetPasswordFormAction} className="w-full sm:w-auto">
            <input type="hidden" name="userId" value={customer.id} />
            <Button type="submit" className="w-full sm:w-auto">
              Send password reset
            </Button>
          </form>
          <form action={banFormAction} className="w-full sm:w-auto">
            <input type="hidden" name="userId" value={customer.id} />
            <input type="hidden" name="ban" value="true" />
            <Button
              type="submit"
              variant="outline"
              className="w-full border-red-500/40 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 sm:w-auto"
            >
              Ban customer
            </Button>
          </form>
        </div>
      </DashboardSection>
    </div>
  );
}
