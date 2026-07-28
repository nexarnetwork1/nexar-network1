import Link from "next/link";
import type { PlatformSettings } from "@/types";

type MarketplaceAdminSettingsProps = {
  settings: PlatformSettings | null;
  latestFees: Record<string, number>;
  merchantCount: number;
  marketplaceRevenue: number;
};

export function MarketplaceAdminSettings({
  settings,
  latestFees,
  merchantCount,
  marketplaceRevenue,
}: MarketplaceAdminSettingsProps) {
  const discountPercent = settings?.merchant_promotion_discount_percent ?? 0.5;
  const durationDays = settings?.merchant_promotion_duration_days ?? 90;
  const nxrFee = latestFees.nxr ?? 0.0035;
  const cryptoFee = latestFees.crypto_other ?? 0.005;
  const listPrice = 20;
  const promoPrice = listPrice * (1 - discountPercent);

  const promoEnd = new Date();
  promoEnd.setDate(promoEnd.getDate() + durationDays);

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">Marketplace subscription</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-zinc-500">Store subscription price</dt>
            <dd className="mt-1 text-xl font-bold">${listPrice.toFixed(2)} / month</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Launch promo price</dt>
            <dd className="mt-1 text-xl font-bold text-emerald-400">${promoPrice.toFixed(2)} / month</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Launch discount</dt>
            <dd className="mt-1 font-medium">{(discountPercent * 100).toFixed(0)}% OFF (first {durationDays} days)</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Promotion window</dt>
            <dd className="mt-1 font-medium">
              {new Date().toLocaleDateString()} → {promoEnd.toLocaleDateString()}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-zinc-500">
          Paid in supported cryptocurrencies only. Edit promotion in{" "}
          <Link href="/admin/settings" className="text-yellow-400 hover:underline">
            Platform Settings
          </Link>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">Marketplace fees</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-zinc-500">NXR fee</dt>
            <dd className="mt-1 text-xl font-bold">{(nxrFee * 100).toFixed(2)}%</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Other cryptocurrencies fee</dt>
            <dd className="mt-1 text-xl font-bold">{(cryptoFee * 100).toFixed(2)}%</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">Marketplace statistics</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-zinc-500">Merchant count</dt>
            <dd className="mt-1 text-2xl font-bold">{merchantCount}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Marketplace revenue</dt>
            <dd className="mt-1 text-2xl font-bold">${marketplaceRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
