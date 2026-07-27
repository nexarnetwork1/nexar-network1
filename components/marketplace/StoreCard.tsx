import { BadgeCheck, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { StoreDirectoryEntry } from "@/types";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import type { PaymentMethodCode } from "@/lib/constants/payment-branding";
import { getStorePaymentMethods } from "@/lib/constants/payment-branding";

type StoreCardProps = {
  store: StoreDirectoryEntry;
};

export function StoreCard({ store }: StoreCardProps) {
  const profile = store.settings?.marketplace_profile;
  const banner = profile?.banner_url;
  const description =
    profile?.description ?? store.business_type ?? "Nexar marketplace merchant";
  const payments = store.settings
    ? getStorePaymentMethods(store.settings)
    : ["nxr", "bnb", "usdt"];

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5">
      <div className="relative h-32 bg-gradient-to-br from-surface to-background">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full opacity-40"
            style={{
              background: `linear-gradient(135deg, ${profile?.primary_color ?? "#D4AF37"}33, ${profile?.secondary_color ?? "#1a1a1a"}88)`,
            }}
          />
        )}
        {store.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.logo_url}
            alt=""
            className="absolute -bottom-6 left-4 h-14 w-14 rounded-xl border-2 border-background object-cover shadow-lg"
          />
        )}
      </div>

      <div className="p-4 pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">{store.name}</h2>
          {store.verification_status === "verified" && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {store.is_top_seller && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
              <TrendingUp className="h-3 w-3" /> Top Seller
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted">{description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          {store.rating > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              {store.rating.toFixed(1)}
            </span>
          )}
          <span>{store.product_count} products</span>
          <span>{store.sales_count} sales</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {payments.slice(0, 5).map((method) => (
            <PaymentMethodLogo key={method} method={method as PaymentMethodCode} size={16} showLabel={false} />
          ))}
        </div>

        <Link
          href={`/store/${store.slug}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gold/30 bg-gold/10 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/20"
        >
          Visit Store
        </Link>
      </div>
    </article>
  );
}
