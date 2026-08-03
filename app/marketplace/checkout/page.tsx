import type { Metadata } from "next";
import { privateAreaMetadata } from "@/lib/constants/seo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CheckoutButton } from "@/components/orders/CheckoutButton";
import { Button } from "@/components/ui/Button";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { getMarketplaceCartWithItems } from "@/modules/marketplace/cart/server";
import { getCurrentProfile } from "@/modules/users/repository";

export const metadata: Metadata = {
  ...privateAreaMetadata,
  title: "Checkout · Nexar Commerce",
  description: "Complete your Nexar Commerce purchase securely.",
};

export default async function MarketplaceCheckoutPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") {
    redirect(commerceAuthHref({ auth: "signin", redirect: MARKETPLACE_ROUTES.checkout }));
  }

  const { items } = await getMarketplaceCartWithItems(profile.id);
  if (!items.length) {
    redirect(MARKETPLACE_ROUTES.cart);
  }

  const subtotal = items.reduce(
    (sum, line) => sum + Number(line.product.price) * line.quantity,
    0,
  );
  const currency = items[0]?.product.currency ?? "USD";
  const storeIds = new Set(items.map((line) => line.product.store_id));

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-white">Checkout</h1>
        <p className="mt-2 text-muted">
          Confirm your order. One invoice is created per store, then you pay securely.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="nxr-card p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Order items</h2>
          <ul className="mt-4 space-y-4">
            {items.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-white">{line.product.name}</p>
                  <p className="text-muted">
                    Qty {line.quantity} · {line.product.store?.name}
                  </p>
                </div>
                <p className="font-mono text-gold">
                  {(Number(line.product.price) * line.quantity).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {line.product.currency}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            Shipping details can be coordinated with the merchant after payment for physical goods.
          </p>
        </section>

        <aside className="h-fit nxr-card p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Payment summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <dt>Stores</dt>
              <dd>{storeIds.size}</dd>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-3 text-white">
              <dt className="font-medium">Total due</dt>
              <dd className="font-mono text-gold">
                {subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}{" "}
                {currency}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <CheckoutButton />
          </div>
          <Link href={MARKETPLACE_ROUTES.cart} className="mt-4 block">
            <Button variant="secondary" className="w-full">
              Back to cart
            </Button>
          </Link>
        </aside>
      </div>
    </Container>
  );
}
