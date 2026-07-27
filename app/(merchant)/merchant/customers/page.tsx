import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreCustomers } from "@/modules/stores/repository";
import { formatDateTime } from "@/utils/format";

export default async function MerchantCustomersPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const store = await getMerchantStore(profile.id);
  if (!store) {
    return (
      <div>
        <h1 className="font-heading text-3xl text-gold">Customers</h1>
        <p className="mt-4 text-muted">Complete store setup to view customers.</p>
      </div>
    );
  }

  const customers = await getStoreCustomers(store.id);

  return (
    <div>
      <h1 className="font-heading text-3xl text-gold">Customers</h1>
      <p className="mt-2 text-muted">Customers who have ordered from {store.name}</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-muted">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Since</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium">{customer.full_name ?? "—"}</td>
                <td className="px-4 py-3">{customer.email}</td>
                <td className="px-4 py-3">{customer.order_count}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(customer.created_at)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
