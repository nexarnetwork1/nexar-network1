import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCartWithItems } from "@/modules/cart/repository";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartOrderSummary } from "@/components/cart/CartOrderSummary";
import { Button } from "@/components/ui/Button";
import { groupCartItemsByStore } from "@/utils/cart";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

export default async function CartPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { items } = await getCartWithItems(profile.id);
  const storeGroups = groupCartItemsByStore(items);
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
                  Store subtotal:{" "}
                  <CurrencyAmount amount={group.subtotal} currency={items[0]?.product.currency ?? "USD"} size={16} />
                </p>
                <div className="mt-4">
                  {group.items.map((item) => (
                    <CartItemRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <CartOrderSummary items={items} storeCount={storeCount} />
        </div>
      )}
    </div>
  );
}
