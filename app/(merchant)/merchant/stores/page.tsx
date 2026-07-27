import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore, getMerchantStores } from "@/modules/stores/repository";
import { StoreSwitcher } from "@/components/stores/StoreSwitcher";
import Link from "next/link";

export default async function MerchantStoresPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const stores = await getMerchantStores(profile.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Stores</h1>
        <StoreSwitcher stores={stores} />
      </div>
      <p className="mt-2 text-muted">Manage multiple storefronts from one merchant account.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {stores.map((store) => (
          <Link key={store.id} href={`/merchant?store=${store.id}`} className="rounded-xl border border-border p-6 hover:border-gold/40">
            <h2 className="font-semibold text-white">{store.name}</h2>
            <p className="text-sm text-muted">{store.slug} · {store.mode}</p>
            <p className="mt-2 text-xs uppercase text-muted">{store.status}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
