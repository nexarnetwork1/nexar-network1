import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCartWithItems } from "@/modules/cart/repository";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CheckoutButton } from "@/components/orders/CheckoutButton";
import { Button } from "@/components/ui/Button";
import { groupCartItemsByStore } from "@/utils/cart";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

export default async function CartPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { items } = await getCartWithItems(profile.id);
  const storeGroups = groupCartItemsByStore(items);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const currency = items[0]?.product.currency ?? "USD";
  const storeCount = storeGroups.length;

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Cart</h1>
      <p className="mt-2 text-muted">
        {items.length === 0
          ? "Your cart is empty"
          : `${items.length} item${items.length === 1 ? "" : "s"} from ${storeCount} store${storeCount === 1 ? "" : "s"}`}
      </p>

      {items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center">
          <p className="text-muted">Browse products to add items to your cart.</p>
          <Link href="/customer/browse" className="mt-4 inline-block">
            <Button variant="secondary">Browse products</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {storeGroups.map((group) => (
              <section
                key={group.storeId}
                className="rounded-2xl border border-border bg-card/20 p-6"
              >
                <h2 className="font-heading text-lg font-semibold">{group.storeName}</h2>
                <p className="mt-1 text-sm text-muted">
                  Store subtotal: <CurrencyAmount amount={group.subtotal} currency={currency} size={16} />
                </p>
                <div className="mt-4">
                  {group.items.map((item) => (
                    <CartItemRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h2 className="font-heading text-lg font-semibold">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <CurrencyAmount amount={subtotal} currency={currency} size={16} amountClassName="font-medium" />
              </div>
              <div className="flex justify-between text-muted">
                <span>Platform fees</span>
                <span>At checkout</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Discounts / coupons</span>
                <span>—</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>—</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tax</span>
                <span>—</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Grand total</span>
                <CurrencyAmount amount={subtotal} currency={currency} size={16} amountClassName="font-semibold" />
              </div>
            </div>
            {storeCount > 1 && (
              <p className="mt-3 text-xs text-muted">
                Checkout creates {storeCount} separate orders (one per store).
              </p>
            )}
            <div className="mt-6">
              <CheckoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
