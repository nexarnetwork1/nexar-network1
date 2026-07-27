import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/modules/platform/repository";
import { getCustomerWalletSummaryAdmin, getCustomerPurchaseHistoryAdmin } from "@/modules/wallet/repository";
import { banUserAction, resetUserPasswordAction } from "@/modules/platform/actions";
import { formatDateTime } from "@/utils/format";

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

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-yellow-400 hover:underline">
        ← Back to customers
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-yellow-400">
        {customer.full_name ?? customer.email}
      </h1>
      <p className="mt-2 text-zinc-400">{customer.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total orders" value={String(cp?.total_orders ?? 0)} />
        <Stat label="Total spent" value={`$${Number(cp?.total_spent_usd ?? 0).toFixed(2)}`} />
        <Stat label="Preferred currency" value={cp?.preferred_currency ?? "USD"} />
      </div>

      <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">Wallet</h2>
        <p className="mt-2 font-mono text-sm">{customer.wallet_address ?? "No wallet linked"}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {wallet.transactions.slice(0, 10).map((tx) => (
            <li key={tx.id} className="flex justify-between border-b border-white/5 pb-2">
              <span className="capitalize">{tx.tx_type.replace("_", " ")}</span>
              <span>${Number(tx.amount).toFixed(2)} {tx.currency}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">Purchase history</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {purchases.map((p) => (
            <li key={p.order_id} className="flex justify-between">
              <span>{p.store_name}</span>
              <span>${Number(p.total).toFixed(2)} · {formatDateTime(p.paid_at ?? p.created_at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex gap-4">
        <form action={resetPasswordFormAction}>
          <input type="hidden" name="userId" value={customer.id} />
          <button type="submit" className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black">
            Send password reset
          </button>
        </form>
        <form action={banFormAction}>
          <input type="hidden" name="userId" value={customer.id} />
          <input type="hidden" name="ban" value="true" />
          <button type="submit" className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400">
            Ban customer
          </button>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
