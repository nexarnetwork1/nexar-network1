import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore, getStoreSettings } from "@/modules/stores/repository";
import { getStoreBranding } from "@/modules/marketplace/storefront/repository";
import { StoreBuilder } from "@/components/merchant/StoreBuilder";

export default async function StoreBuilderPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");
  if (store.mode !== "marketplace") redirect("/merchant/store");

  const [settings, branding] = await Promise.all([
    getStoreSettings(store.id),
    getStoreBranding(store.id),
  ]);

  if (!settings) redirect("/merchant/store");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Store Builder</h1>
          <p className="mt-2 text-muted">
            Configure your public storefront — branding, policies, SEO, and more.
          </p>
        </div>
        <Link href="/merchant/store" className="text-sm text-gold hover:underline">
          ← Store settings
        </Link>
      </div>
      <div className="mt-8">
        <StoreBuilder store={store} settings={settings} branding={branding} />
      </div>
    </div>
  );
}
