import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore, getStoreSettings, getStoreQrCodes } from "@/modules/stores/repository";
import { getActiveStorePromotion } from "@/modules/promotions/repository";
import { StoreQrCodes } from "@/components/merchant/StoreQrCodes";
import { StoreSettingsForm } from "@/components/merchant/StoreSettingsForm";
import { StoreAppearanceForm } from "@/components/merchant/StoreAppearanceForm";
import { formatDate } from "@/utils/format";

export default async function MerchantStorePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const [settings, qrCodes, promotion] = await Promise.all([
    getStoreSettings(store.id),
    getStoreQrCodes(store.id),
    getActiveStorePromotion(store.id),
  ]);

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

      {settings && store.mode === "marketplace" && (
        <>
          <h2 className="mt-10 font-heading text-lg font-semibold">Store Appearance</h2>
          <p className="mt-1 text-sm text-muted">
            Customize how your store looks on the marketplace and public storefront.
          </p>
          <StoreAppearanceForm store={store} settings={settings} />
        </>
      )}

      {settings && (
        <>
          <h2 className="mt-10 font-heading text-lg font-semibold">Payment preferences</h2>
          <StoreSettingsForm settings={settings} />
        </>
      )}

      {promotion && (
        <>
          <h2 className="mt-10 font-heading text-lg font-semibold">Active promotion</h2>
          <div className="mt-4 max-w-lg rounded-2xl border border-gold/30 bg-gold/5 p-5">
            <p className="font-medium text-gold">
              {Number(promotion.discount_percent)}% platform fee discount
            </p>
            <p className="mt-1 text-sm text-muted">
              Expires {formatDate(promotion.expires_at)}
            </p>
          </div>
        </>
      )}

      <h2 className="mt-10 font-heading text-lg font-semibold">Store QR codes</h2>
      <p className="mt-2 text-sm text-muted">
        Share these with customers for marketplace browsing or direct payments.
      </p>
      <div className="mt-4">
        <StoreQrCodes codes={qrCodes} />
      </div>
    </div>
  );
}
