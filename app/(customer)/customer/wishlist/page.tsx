import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getWishlistItems } from "@/modules/wishlist/repository";
import { ProductCard } from "@/components/marketplace/ProductCard";

export default async function CustomerWishlistPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const items = await getWishlistItems(profile.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Wishlist</h1>
      <p className="mt-2 text-muted">Products you saved for later</p>

      {items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center text-muted">
          <p>Your wishlist is empty.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/marketplace/browse" className="text-gold hover:underline">
              Browse marketplace →
            </Link>
            <Link href="/customer/browse" className="text-gold hover:underline">
              Browse products →
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) =>
            item.product ? (
              <li key={item.id}>
                <ProductCard product={item.product} showMoveToCart productBasePath="/marketplace/products" />
              </li>
            ) : null
          )}
        </ul>
      )}
    </div>
  );
}
