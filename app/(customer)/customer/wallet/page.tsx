import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerOrders } from "@/modules/orders/repository";

export default async function CustomerWalletPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const orders = await getCustomerOrders(profile.id);
  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.subtotal), 0);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Wallet</h1>
      <p className="mt-2 text-muted">Your connected BSC wallet and purchase history</p>

      <dl className="mt-8 max-w-lg space-y-4 rounded-2xl border border-border bg-card/40 p-6">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Wallet address</dt>
          <dd className="mt-1 break-all font-mono text-sm text-gold-secondary">
            {profile.wallet_address ?? "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Total spent</dt>
          <dd className="mt-1 font-heading text-2xl text-gold">
            ${totalSpent.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Completed orders</dt>
          <dd className="mt-1">{paidOrders.length}</dd>
        </div>
      </dl>
    </div>
  );
}
