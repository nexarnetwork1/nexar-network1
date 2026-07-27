"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Heart, Share2, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import type { ProductWithStore, StoreMarketplaceProfile, StoreSettings } from "@/types";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import { getStorePaymentMethods } from "@/lib/constants/payment-branding";
import type { PaymentMethodCode } from "@/lib/constants/payment-branding";
import { useFollowStore } from "@/hooks/useFollowStore";
import { formatDateTime } from "@/utils/format";

type StorefrontProps = {
  store: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    business_type: string | null;
    created_at: string;
  };
  profile: StoreMarketplaceProfile;
  settings: StoreSettings | null;
  products: ProductWithStore[];
  productCount: number;
  salesCount: number;
  rating: number;
  verificationStatus: string | null;
};

export function StorefrontClient({
  store,
  profile,
  settings,
  products,
  productCount,
  salesCount,
  rating,
  verificationStatus,
}: StorefrontProps) {
  const [tab, setTab] = useState<"products" | "about" | "reviews" | "policies" | "contact">(
    "products"
  );
  const { toggle, isFollowing } = useFollowStore();
  const payments = settings ? getStorePaymentMethods(settings) : ["nxr", "bnb", "usdt"];

  async function shareStore() {
    const url = `${window.location.origin}/store/${store.slug}`;
    if (navigator.share) {
      await navigator.share({ title: store.name, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Store link copied");
    }
  }

  const banner = profile.banner_url;
  const primary = profile.primary_color ?? "#D4AF37";
  const secondary = profile.secondary_color ?? "#1a1a1a";

  return (
    <div>
      <div
        className="relative h-48 overflow-hidden rounded-2xl md:h-64"
        style={{
          background: banner
            ? undefined
            : `linear-gradient(135deg, ${primary}44, ${secondary})`,
        }}
      >
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      </div>

      <div className="-mt-12 relative flex flex-col gap-4 px-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logo_url}
              alt=""
              className="h-24 w-24 rounded-2xl border-4 border-background object-cover shadow-xl"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-background bg-surface text-2xl font-bold text-gold">
              {store.name.slice(0, 1)}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold md:text-4xl">{store.name}</h1>
              {verificationStatus === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
              {salesCount >= 10 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold">
                  <TrendingUp className="h-3.5 w-3.5" /> Top Seller
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
              {rating > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" /> {rating.toFixed(1)}
                </span>
              )}
              <span>{productCount} products</span>
              <span>{salesCount} sales</span>
              <span>Joined {formatDateTime(store.created_at).split(",")[0]}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggle(store.slug)}
            className={`inline-flex items-center gap-1 rounded-xl border px-4 py-2 text-sm ${
              isFollowing(store.slug)
                ? "border-gold/50 bg-gold/10 text-gold"
                : "border-border text-muted hover:text-white"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFollowing(store.slug) ? "fill-current" : ""}`} />
            {isFollowing(store.slug) ? "Following" : "Follow Store"}
          </button>
          <button
            type="button"
            onClick={shareStore}
            className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {payments.map((method) => (
          <PaymentMethodLogo key={method} method={method as PaymentMethodCode} size={18} />
        ))}
      </div>

      <nav className="mt-8 flex flex-wrap gap-1 border-b border-border">
        {(["products", "about", "reviews", "policies", "contact"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition ${
              tab === t
                ? "border-b-2 text-gold"
                : "text-muted hover:text-white"
            }`}
            style={tab === t ? { borderColor: primary } : undefined}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "products" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && (
              <p className="col-span-full text-center text-muted">No products listed yet.</p>
            )}
          </div>
        )}

        {tab === "about" && (
          <div className="max-w-2xl space-y-4 text-muted leading-relaxed">
            <p>{profile.description ?? store.business_type ?? "Welcome to our store on Nexar Network."}</p>
            {profile.website && (
              <p>
                Website:{" "}
                <a href={profile.website} className="text-gold hover:underline" target="_blank" rel="noreferrer">
                  {profile.website}
                </a>
              </p>
            )}
          </div>
        )}

        {tab === "reviews" && (
          <p className="text-muted">
            {salesCount > 0
              ? `Trusted by ${salesCount} completed orders. Full review system coming soon.`
              : "No reviews yet — be the first to purchase!"}
          </p>
        )}

        {tab === "policies" && (
          <div className="prose prose-invert max-w-2xl text-sm text-muted">
            {profile.policies ?? "Standard Nexar marketplace policies apply. Contact the merchant for returns and refunds."}
          </div>
        )}

        {tab === "contact" && (
          <dl className="grid max-w-lg gap-3 text-sm">
            {profile.business_email && (
              <div>
                <dt className="text-muted">Email</dt>
                <dd>{profile.business_email}</dd>
              </div>
            )}
            {profile.business_phone && (
              <div>
                <dt className="text-muted">Phone</dt>
                <dd>{profile.business_phone}</dd>
              </div>
            )}
            {profile.business_address && (
              <div>
                <dt className="text-muted">Address</dt>
                <dd>{profile.business_address}</dd>
              </div>
            )}
            {profile.business_hours && (
              <div>
                <dt className="text-muted">Hours</dt>
                <dd>
                  <ul className="mt-1 space-y-0.5">
                    {Object.entries(profile.business_hours).map(([day, hours]) => (
                      <li key={day} className="capitalize">
                        {day}: {hours}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              {profile.facebook && <a href={profile.facebook} className="text-gold hover:underline">Facebook</a>}
              {profile.instagram && <a href={profile.instagram} className="text-gold hover:underline">Instagram</a>}
              {profile.twitter && <a href={profile.twitter} className="text-gold hover:underline">X</a>}
              {profile.tiktok && <a href={profile.tiktok} className="text-gold hover:underline">TikTok</a>}
            </div>
          </dl>
        )}
      </div>

      <p className="mt-12 text-center text-sm text-muted">
        <Link href="/login" className="text-gold hover:underline">Sign in</Link> to purchase from this store.
      </p>
    </div>
  );
}
