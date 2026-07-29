import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { MarketplaceCartClient } from "@/components/cart/MarketplaceCartClient";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { MarketplaceArtwork } from "@/components/marketplace/MarketplaceArtwork";
import { buildMarketplaceMetadata } from "@/lib/seo/marketplace";

export const metadata = buildMarketplaceMetadata({
  title: "Cart",
  description: "Review marketplace items before signing in to checkout.",
  path: "/marketplace/cart",
});

export default async function MarketplaceCartPage() {
  const profile = await getCurrentProfile();
  if (profile?.role === "customer") {
    redirect("/customer/cart");
  }

  return (
    <>
      <div className="relative min-h-[calc(100vh-var(--nxr-header-offset))]">
        <MarketplaceArtwork />
        <Container as="div" className="relative nav-offset pb-16">
          <h1 className="font-heading text-3xl font-semibold">Cart</h1>
          <p className="mt-2 text-muted">Review items and sign in when you are ready to checkout.</p>
          <MarketplaceCartClient />
        </Container>
      </div>
      <Footer />
    </>
  );
}
