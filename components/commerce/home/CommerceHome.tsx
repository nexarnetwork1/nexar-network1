"use client";

import dynamic from "next/dynamic";
import type { CommerceHomeData } from "@/lib/commerce/types";
import { CommerceHero } from "./sections/CommerceHero";
import { LiveStatistics } from "./sections/LiveStatistics";

const GlobalNetwork = dynamic(() =>
  import("./sections/GlobalNetwork").then((m) => m.GlobalNetwork),
);
const MerchantNetwork = dynamic(() =>
  import("./sections/MerchantNetwork").then((m) => m.MerchantNetwork),
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
const PaymentEcosystem = dynamic(() =>
  import("./sections/PaymentEcosystem").then((m) => m.PaymentEcosystem),
);
const WalletEcosystem = dynamic(() =>
  import("./sections/WalletEcosystem").then((m) => m.WalletEcosystem),
);
const MerchantExperience = dynamic(() =>
  import("./sections/MerchantExperience").then((m) => m.MerchantExperience),
);
const MerchantPricing = dynamic(() =>
  import("./sections/MerchantPricing").then((m) => m.MerchantPricing),
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
    <>
      <main className="relative">
        <CommerceHero initialMetrics={data.liveMetrics} />
        <LiveStatistics initialMetrics={data.liveMetrics} />
        <GlobalNetwork
          countryCodes={countryCodes}
          countries={data.countries}
          initialActivity={data.activity}
        />
        <MerchantNetwork merchants={data.merchantNetwork} />
        <FeaturedStores initialStores={data.marketplace.featured_stores} />
        <TrendingProducts
          initialTrending={data.marketplace.trending_products}
          initialLatest={data.marketplace.latest_products}
          initialTopRated={data.topRatedProducts}
          initialFlashDeals={data.flashDealProducts}
        />
        <MarketplaceCategories categories={data.categories} />
        <PaymentEcosystem />
        <WalletEcosystem />
        <MerchantExperience />
        <MerchantPricing plans={data.subscriptionPlans} />
        <FaqSection />
        <CommerceCta />
        <CommerceFooter initialMetrics={data.liveMetrics} countries={data.countries} />
      </main>
    </>
  );
}
