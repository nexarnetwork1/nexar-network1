"use client";

import dynamic from "next/dynamic";
import type { CommerceHomeData } from "@/lib/commerce/types";
import { CommerceHero } from "./sections/CommerceHero";
import { LiveStatistics } from "./sections/LiveStatistics";

const TrustedBrands = dynamic(() =>
  import("./sections/TrustedBrands").then((m) => m.TrustedBrands),
);
const FeaturedStores = dynamic(() =>
  import("./sections/FeaturedStores").then((m) => m.FeaturedStores),
);
const TrendingProducts = dynamic(() =>
  import("./sections/TrendingProducts").then((m) => m.TrendingProducts),
);
const MarketplaceCategories = dynamic(() =>
  import("./sections/MarketplaceCategories").then((m) => m.MarketplaceCategories),
);
const WhyNexarCommerce = dynamic(() =>
  import("./sections/WhyNexarCommerce").then((m) => m.WhyNexarCommerce),
);
const CryptoPayments = dynamic(() =>
  import("./sections/CryptoPayments").then((m) => m.CryptoPayments),
);
const MerchantPlatform = dynamic(() =>
  import("./sections/MerchantPlatform").then((m) => m.MerchantPlatform),
);
const GlobalNetwork = dynamic(() =>
  import("./sections/GlobalNetwork").then((m) => m.GlobalNetwork),
);
const NexarAi = dynamic(() => import("./sections/NexarAi").then((m) => m.NexarAi));
const DeveloperPlatform = dynamic(() =>
  import("./sections/DeveloperPlatform").then((m) => m.DeveloperPlatform),
);
const PricingSection = dynamic(() =>
  import("./sections/PricingSection").then((m) => m.PricingSection),
);
const FaqSection = dynamic(() => import("./sections/FaqSection").then((m) => m.FaqSection));
const CommerceCta = dynamic(() =>
  import("./sections/CommerceCta").then((m) => m.CommerceCta),
);
const CommerceFooter = dynamic(() =>
  import("./sections/CommerceFooter").then((m) => m.CommerceFooter),
);

type CommerceHomeProps = {
  data: CommerceHomeData;
};

export function CommerceHome({ data }: CommerceHomeProps) {
  const countryCodes =
    data.activeCountryCodes.length > 0
      ? data.activeCountryCodes
      : data.countries.map((c) => c.code);

  return (
    <main className="relative">
      <CommerceHero countryCodes={countryCodes} activity={data.activity} />
      <LiveStatistics initialMetrics={data.liveMetrics} />
      <TrustedBrands initialBrands={data.brands} />
      <FeaturedStores initialStores={data.marketplace.featured_stores} />
      <TrendingProducts
        initialTrending={data.marketplace.trending_products}
        initialLatest={data.marketplace.latest_products}
        initialTopRated={data.topRatedProducts}
        initialFlashDeals={data.flashDealProducts}
      />
      <MarketplaceCategories categories={data.categories} />
      <WhyNexarCommerce />
      <CryptoPayments />
      <MerchantPlatform />
      <GlobalNetwork
        countryCodes={countryCodes}
        countries={data.countries}
        initialActivity={data.activity}
      />
      <NexarAi />
      <DeveloperPlatform />
      <PricingSection plans={data.subscriptionPlans} />
      <FaqSection items={data.faqItems} />
      <CommerceCta />
      <CommerceFooter initialMetrics={data.liveMetrics} countries={data.countries} />
    </main>
  );
}
