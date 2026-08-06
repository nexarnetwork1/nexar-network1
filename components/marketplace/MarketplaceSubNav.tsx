import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMarketplaceCartItemCount } from "@/modules/marketplace/cart/queries";

/**
 * Marketplace sub-navigation.
 * CommerceAuthActions removed — authentication is handled exclusively at /login.
 *
 * Classification: Public Website
 */
export async function MarketplaceSubNav() {
  const profile = await getCurrentProfile();
  const cartCount =
    profile?.role === "customer" ? await getMarketplaceCartItemCount(profile.id) : 0;

  return (
    <div className="border-b border-border/60 bg-surface/30 backdrop-blur-md">
      <Container className="flex flex-wrap items-center gap-2 py-3 text-sm">
        <Link
          href={MARKETPLACE_ROUTES.root}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          Marketplace
        </Link>
        <Link
          href={MARKETPLACE_ROUTES.cart}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
          Cart
          {cartCount > 0 ? (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold">
              {cartCount}
            </span>
          ) : null}
        </Link>
        <Link
          href={MARKETPLACE_ROUTES.wishlist}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          <Heart className="h-3.5 w-3.5" aria-hidden />
          Wishlist
        </Link>
      </Container>
    </div>
  );
}
