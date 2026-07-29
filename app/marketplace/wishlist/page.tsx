import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { MarketplaceWishlistClient } from "@/components/marketplace/MarketplaceWishlistClient";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { MarketplaceArtwork } from "@/components/marketplace/MarketplaceArtwork";
import { buildMarketplaceMetadata } from "@/lib/seo/marketplace";

export const metadata = buildMarketplaceMetadata({
  title: "Wishlist",
  description: "Review saved marketplace products and sign in to keep them in your account.",
  path: "/marketplace/wishlist",
});

export default async function MarketplaceWishlistPage() {
  const profile = await getCurrentProfile();
  if (profile?.role === "customer") {
    redirect("/customer/wishlist");
  }

  return (
    <>
      <div className="relative min-h-[calc(100vh-var(--nxr-header-offset))]">
        <MarketplaceArtwork />
        <Container as="div" className="relative nav-offset pb-16">
          <h1 className="font-heading text-3xl font-semibold">Wishlist</h1>
          <p className="mt-2 text-muted">
            Saved products from your current session. Sign in to keep them permanently.
          </p>
          <MarketplaceWishlistClient />
        </Container>
      </div>
      <Footer />
    </>
  );
}
