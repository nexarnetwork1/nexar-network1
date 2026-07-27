import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCartWithItems } from "@/modules/cart/repository";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CheckoutButton } from "@/components/orders/CheckoutButton";
import { Button } from "@/components/ui/Button";

export default async function CartPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { items } = await getCartWithItems(profile.id);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Cart</h1>
      <p className="mt-2 text-muted">
        {items.length === 0
          ? "Your cart is empty"
          : `${items.length} item${items.length === 1 ? "" : "s"}`}
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
          <div className="lg:col-span-2">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h2 className="font-heading text-lg font-semibold">Summary</h2>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium">USD {subtotal.toFixed(2)}</span>
            </div>
            <CheckoutButton />
            <p className="mt-3 text-xs text-muted">
              Creates an order and invoice per store. Payment in the next step.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
