import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import {
  getCustomerRecentlyViewedMarketplaceProducts,
  getMarketplaceHomeData,
} from "@/modules/marketplace/home";
import { getCurrentProfile } from "@/modules/users/repository";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { MarketplaceCategoryGrid } from "@/components/marketplace/MarketplaceCategoryGrid";
import { MarketplaceProductRail } from "@/components/marketplace/MarketplaceProductRail";
import { MarketplaceStoreRail } from "@/components/marketplace/MarketplaceStoreRail";
import { RecentlyViewedProductRail } from "@/components/marketplace/RecentlyViewedProductRail";
import { buildMarketplaceMetadata } from "@/lib/seo/marketplace";

export const metadata = buildMarketplaceMetadata({
  title: "Marketplace",
  description:
    "Shop verified Nexar merchants with crypto and card payments. Featured products, trending picks, and categories in one place.",
  path: "/marketplace",
});

export default async function MarketplaceHomePage() {
  const profile = await getCurrentProfile();
  const [{ categories, featured, trending, newest, bestSellers, flashDeals, featuredMerchants }, recentlyViewed] =
    await Promise.all([
      getMarketplaceHomeData(),
      profile?.role === "customer"
        ? getCustomerRecentlyViewedMarketplaceProducts(profile.id, 8)
        : Promise.resolve([]),
    ]);

  return (
    <>
      <main className="relative min-h-[calc(100vh-var(--nxr-header-offset))]">
        <MarketplaceHero categories={categories} />
        <Container as="div" className="pb-16">
          <MarketplaceCategoryGrid categories={categories} />

          {recentlyViewed.length > 0 ? (
            <MarketplaceProductRail
              title="Recently Viewed"
              description="Pick up where you left off with products you opened recently."
              products={recentlyViewed}
            />
          ) : (
            <RecentlyViewedProductRail />
          )}

          <MarketplaceProductRail
            title="Featured Products"
            description="Hand-picked listings from verified Nexar merchants."
            products={featured}
            viewAllHref="/marketplace/browse?sort=featured"
          />

          <MarketplaceProductRail
            title="Trending Now"
            description="Popular products viewed across the marketplace this week."
            products={trending}
            viewAllHref="/marketplace/browse?sort=best_selling"
          />

          <MarketplaceProductRail
            title="New Arrivals"
            description="Fresh listings added by merchants recently."
            products={newest}
            showNewBadge
            viewAllHref="/marketplace/browse?sort=newest"
          />

          <MarketplaceProductRail
            title="Best Sellers"
            description="Top-performing products by order volume."
            products={bestSellers}
            viewAllHref="/marketplace/browse?sort=best_selling"
          />

          <MarketplaceProductRail
            title="Flash Deals"
            description="Limited-time discounts from verified merchants."
            products={flashDeals}
            viewAllHref="/marketplace/browse?sale=true"
          />

          <MarketplaceStoreRail
            title="Featured Merchants"
            description="Verified stores hand-picked across the Nexar marketplace."
            stores={featuredMerchants}
            viewAllHref="/marketplace/stores?sort=featured"
          />

          <div className="mt-12 rounded-3xl border border-gold/20 bg-gold/5 px-6 py-8 text-center sm:px-10">
            <h2 className="font-heading text-2xl font-semibold">Sell on Nexar Marketplace</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted">
              Launch your store, accept NXR and supported cryptocurrencies, and reach customers across the Nexar Network.
            </p>
            <Link
              href="/register/merchant"
              className="mt-6 inline-flex rounded-full border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold transition hover:bg-gold/20"
            >
              Register as Merchant
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
