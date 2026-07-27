import Link from "next/link";
import { getCustomers } from "@/modules/platform/repository";
import { banUserAction, resetUserPasswordAction } from "@/modules/platform/actions";
import { ExportButton } from "@/components/admin/ExportButton";
import { formatDateTime } from "@/utils/format";
import { UsdAmount } from "@/components/payments/CurrencyAmount";

async function banFormAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  const ban = formData.get("ban") === "true";
  await banUserAction(userId, ban);
}

async function resetPasswordFormAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  await resetUserPasswordAction(userId);
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Customers</h1>
          <p className="mt-2 text-zinc-400">{customers.length} registered customers</p>
        </div>
        <ExportButton resource="customers" />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Spent</th>
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const cp = customer.customer_profile as {
                total_orders?: number;
                total_spent_usd?: number;
              } | null;

              return (
                <tr key={customer.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${customer.id}`} className="font-medium hover:text-yellow-400">
                      {customer.full_name ?? customer.email}
                    </Link>
                    <p className="text-xs text-zinc-500">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3">{cp?.total_orders ?? 0}</td>
                  <td className="px-4 py-3">
                    <UsdAmount amount={Number(cp?.total_spent_usd ?? 0)} size={16} />
                  </td>
                  <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs">
                    {customer.wallet_address ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDateTime(customer.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={resetPasswordFormAction}>
                        <input type="hidden" name="userId" value={customer.id} />
                        <button type="submit" className="text-xs text-yellow-400 hover:underline">
                          Reset password
                        </button>
                      </form>
                      <form action={banFormAction}>
                        <input type="hidden" name="userId" value={customer.id} />
                        <input type="hidden" name="ban" value="true" />
                        <button type="submit" className="text-xs text-red-400 hover:underline">
                          Ban
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
