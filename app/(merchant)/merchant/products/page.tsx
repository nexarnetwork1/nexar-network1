import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantProductsWithInventory } from "@/modules/catalog/repository";
import { toggleProductFormAction, deleteProductFormAction } from "@/modules/catalog/actions";
import { ProductPrice } from "@/components/catalog/ProductPrice";
import { Button } from "@/components/ui/Button";
import {
  DashboardActions,
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

export default async function MerchantProductsPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/merchant/products");
}
  const store = await getMerchantStore(profile.id);
  if (!store) {
    return (
      <DashboardSection
        as="div"
        level="h1"
        title="Products"
        description="No store found. Contact support."
      />
    );
  }

  if (store.mode === "payments_only") {
    redirect("/merchant/invoices/new");
  }

  const products = await getMerchantProductsWithInventory(store.id);
  const lowStockCount = products.filter(
    (p) =>
      p.inventory &&
      p.inventory.quantity_on_hand - p.inventory.reserved_quantity <=
        p.inventory.low_stock_threshold
  ).length;

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Products"
        description={
          <>
            Manage your catalog for {store.name}
            {store.status !== "active" && (
              <span className="ml-2 text-gold">(store pending approval)</span>
            )}
            {lowStockCount > 0 && (
              <span className="ml-2 text-gold">({lowStockCount} low stock)</span>
            )}
          </>
        }
        actions={
          <DashboardActions>
            <Link href="/merchant/products/new">
              <Button>Add product</Button>
            </Link>
            <Link href="/merchant/categories">
              <Button variant="secondary">Categories</Button>
            </Link>
          </DashboardActions>
        }
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Your products" minWidth="52rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Product</DashboardTableHeader>
              <DashboardTableHeader>Price</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Stock</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Status</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {products.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<Package className="h-5 w-5" aria-hidden />}
                  title="No products yet"
                  description="Add your first product to start selling."
                  action={
                    <Link href="/merchant/products/new">
                      <Button variant="secondary">Create your first product</Button>
                    </Link>
                  }
                />
              </DashboardTableEmpty>
            ) : (
              products.map((product) => (
                <DashboardTableRow key={product.id} interactive>
                  <DashboardTableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <ProductPrice
                      price={Number(product.price)}
                      compareAtPrice={product.compare_at_price}
                      currency={product.currency}
                      size="sm"
                      showBadge
                    />
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="sm">
                    <span
                      className={
                        product.inventory &&
                        product.inventory.quantity_on_hand -
                          product.inventory.reserved_quantity <=
                          product.inventory.low_stock_threshold
                          ? "text-gold"
                          : ""
                      }
                    >
                      {product.stock}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="md">
                    <span className={product.is_active ? "text-emerald-400" : "text-muted"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell align="right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/merchant/products/${product.id}/edit`}
                        className="text-gold hover:text-gold-secondary"
                      >
                        Edit
                      </Link>
                      <form action={toggleProductFormAction}>
                        <input type="hidden" name="productId" value={product.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(!product.is_active)}
                        />
                        <button type="submit" className="text-muted hover:text-white">
                          {product.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                      <form action={deleteProductFormAction}>
                        <input type="hidden" name="productId" value={product.id} />
                        <button type="submit" className="text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      </form>
                    </div>
                  </DashboardTableCell>
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
