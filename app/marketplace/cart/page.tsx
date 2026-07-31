import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CartView } from "@/components/storefront/CartView";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMarketplaceCartWithItems } from "@/modules/marketplace/cart";

export const metadata: Metadata = {
  title: "Shopping cart · Nexar Commerce",
  description: "Review items in your Nexar Commerce cart before checkout.",
};

export default async function MarketplaceCartPage() {
  const profile = await getCurrentProfile();
  const { items } =
    profile?.role === "customer"
      ? await getMarketplaceCartWithItems(profile.id)
      : { items: [] };

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-white">Shopping cart</h1>
        <p className="mt-2 text-muted">Review your items and proceed to secure checkout.</p>
      </div>
      <CartView items={items} isAuthenticated={profile?.role === "customer"} />
    </Container>
  );
}
