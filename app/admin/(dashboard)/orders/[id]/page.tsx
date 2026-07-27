import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getOrderById } from "@/modules/orders/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const order = await getOrderById(id);
  if (!order) notFound();

  const invoice = order.invoice;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-muted hover:text-yellow-400">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold text-yellow-400">Order {order.id.slice(0, 8)}…</h1>
        <StatusBadge status={order.status} />
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <dt className="text-xs text-zinc-500">Store</dt>
          <dd className="mt-1 font-medium">{order.store.name}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <dt className="text-xs text-zinc-500">Subtotal</dt>
          <dd className="mt-1">
            <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <dt className="text-xs text-zinc-500">Platform fee</dt>
          <dd className="mt-1">
            <CurrencyAmount amount={Number(order.platform_fee)} currency={order.currency} size={16} />
          </dd>
        </div>
        {invoice && (
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
            <dt className="text-xs text-zinc-500">Invoice</dt>
            <dd className="mt-1 font-mono text-sm">{invoice.invoice_number}</dd>
          </div>
        )}
      </dl>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-white/5">
                <td className="px-4 py-3">{item.product_name}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">
                  <CurrencyAmount amount={Number(item.line_total)} currency={order.currency} size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
