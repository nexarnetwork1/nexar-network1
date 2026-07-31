import Link from "next/link";
import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerPurchaseHistory } from "@/modules/wallet/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/utils/format";
import { UsdAmount } from "@/components/payments/CurrencyAmount";

export default async function CustomerPurchaseHistoryPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/customer/purchases" }));

  const purchases = await getCustomerPurchaseHistory(profile.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Purchase history</h1>
      <p className="mt-2 text-muted">Completed orders and payments</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50 text-left text-muted">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((row) => (
              <tr key={row.order_id} className="border-b border-border/50">
                <td className="px-4 py-3">
                  {formatDateTime(row.paid_at ?? row.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/customer/orders/${row.order_id}`}
                    className="hover:text-gold"
                  >
                    {row.store_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <UsdAmount amount={Number(row.total)} size={16} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && (
          <p className="p-8 text-center text-muted">No completed purchases yet.</p>
        )}
      </div>

      <Link href="/customer/orders" className="mt-6 inline-block text-sm text-gold hover:underline">
        View all orders →
      </Link>
    </div>
  );
}
