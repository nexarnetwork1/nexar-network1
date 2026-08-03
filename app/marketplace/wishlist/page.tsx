import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { privateAreaMetadata } from "@/lib/constants/seo";
import { WishlistView } from "@/components/storefront/WishlistView";
import { getCurrentProfile } from "@/modules/users/repository";
import { getWishlistProducts } from "@/modules/marketplace/wishlist/server";

export const metadata: Metadata = {
  ...privateAreaMetadata,
  title: "Wishlist · Nexar Commerce",
  description: "Your saved products on Nexar Commerce.",
};

export default async function MarketplaceWishlistPage() {
  const profile = await getCurrentProfile();
  const products =
    profile?.role === "customer" || profile?.role === "merchant"
      ? await getWishlistProducts()
      : [];

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-white">Wishlist</h1>
        <p className="mt-2 text-muted">Products you have saved for later.</p>
      </div>
      <WishlistView
        products={products}
        isAuthenticated={profile?.role === "customer" || profile?.role === "merchant"}
      />
    </Container>
  );
}
