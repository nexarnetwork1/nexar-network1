import Link from "next/link";
import { getCartItemCount } from "@/modules/cart/repository";
import { getCurrentProfile } from "@/modules/users/repository";

export async function CartBadge() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const count = await getCartItemCount(profile.id);

  return (
    <Link
      href="/customer/cart"
      className="relative text-muted transition-colors hover:text-white"
    >
      Cart
      {count > 0 && (
        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-medium text-background">
          {count}
        </span>
      )}
    </Link>
  );
}
