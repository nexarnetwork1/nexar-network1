import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantProducts, toggleProductActiveAction, deleteProductAction } from "@/modules/catalog";
import { Button } from "@/components/ui/Button";

async function toggleProductFormAction(formData: FormData) {
  "use server";
  const productId = formData.get("productId") as string;
  const isActive = formData.get("isActive") === "true";
  await toggleProductActiveAction(productId, isActive);
}

async function deleteProductFormAction(formData: FormData) {
  "use server";
  const productId = formData.get("productId") as string;
  await deleteProductAction(productId);
}

export default async function MerchantProductsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const store = await getMerchantStore(profile.id);
  if (!store) {
    return (
      <div>
        <h1 className="font-heading text-3xl font-semibold">Products</h1>
        <p className="mt-4 text-muted">No store found. Contact support.</p>
      </div>
    );
  }

  const products = await getMerchantProducts(store.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Products</h1>
          <p className="mt-2 text-muted">
            Manage your catalog for {store.name}
            {store.status !== "active" && (
              <span className="ml-2 text-amber-400">(store pending approval)</span>
            )}
          </p>
        </div>
        <Link href="/merchant/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center">
          <p className="text-muted">No products yet.</p>
          <Link href="/merchant/products/new" className="mt-4 inline-block">
            <Button variant="secondary">Create your first product</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-left text-muted">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {product.currency} {Number(product.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span className={product.is_active ? "text-emerald-400" : "text-muted"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
