import { getAllProducts } from "@/modules/platform/repository";
import { moderateProductAction } from "@/modules/platform/actions";
import { ExportButton } from "@/components/admin/ExportButton";

async function moderateFormAction(formData: FormData) {
  "use server";
  await moderateProductAction(
    formData.get("productId") as string,
    formData.get("isActive") === "true"
  );
}

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Products</h1>
          <p className="mt-2 text-zinc-400">Moderate marketplace catalog — approve, hide, or restore products</p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const store = product.store as { name?: string; status?: string } | null;
              return (
                <tr key={product.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">
                    {store?.name ?? "—"}
                    {store?.status !== "active" && (
                      <span className="ml-2 text-xs text-amber-400">({store?.status})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">${Number(product.price).toFixed(2)}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    {product.is_active ? (
                      <span className="text-emerald-400">Active</span>
                    ) : (
                      <span className="text-red-400">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action={moderateFormAction} className="flex gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      {product.is_active ? (
                        <>
                          <input type="hidden" name="isActive" value="false" />
                          <button type="submit" className="text-xs text-red-400 hover:underline">Hide</button>
                        </>
                      ) : (
                        <>
                          <input type="hidden" name="isActive" value="true" />
                          <button type="submit" className="text-xs text-emerald-400 hover:underline">Approve</button>
                        </>
                      )}
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
