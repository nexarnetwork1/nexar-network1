import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";

export default async function MerchantStorePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Store settings</h1>
      <p className="mt-2 text-muted">Manage your store profile and configuration</p>

      <dl className="mt-8 max-w-lg space-y-4 rounded-2xl border border-border bg-card/40 p-6">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Store name</dt>
          <dd className="mt-1 font-medium">{store.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Slug</dt>
          <dd className="mt-1 font-mono text-sm">{store.slug}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Business type</dt>
          <dd className="mt-1">{store.business_type ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Mode</dt>
          <dd className="mt-1 capitalize">{store.mode.replace("_", " ")}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Status</dt>
          <dd className="mt-1 capitalize">{store.status}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Payout wallet</dt>
          <dd className="mt-1 break-all font-mono text-sm">{store.wallet_address}</dd>
        </div>
      </dl>
    </div>
  );
}
