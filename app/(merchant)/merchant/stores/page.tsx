import Link from "next/link";
import { Building2 } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStores } from "@/modules/stores/repository";
import { StoreSwitcher } from "@/components/stores/StoreSwitcher";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
} from "@/components/dashboard";

export default async function MerchantStoresPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const stores = await getMerchantStores(profile.id);

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="My Stores"
        description="Manage multiple storefronts from one merchant account."
        actions={<StoreSwitcher stores={stores} />}
      />

      {stores.length === 0 ? (
        <DashboardEmptyState
          icon={<Building2 className="h-5 w-5" aria-hidden />}
          title="No stores yet"
          description="Storefronts linked to this merchant account will be listed here."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {stores.map((store) => (
            <li key={store.id} className="min-w-0">
              <Link
                href={`/merchant?store=${store.id}`}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <DashboardCard interactive className="h-full">
                  <h2 className="break-words font-semibold text-white">{store.name}</h2>
                  <p className="break-words text-sm text-muted">
                    {store.slug} · {store.mode}
                  </p>
                  <p className="mt-2 text-xs uppercase text-muted">{store.status}</p>
                </DashboardCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
