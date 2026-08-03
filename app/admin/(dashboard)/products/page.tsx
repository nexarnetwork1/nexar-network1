import { Package } from "lucide-react";
import { getAllProducts } from "@/modules/platform/repository";
import { moderateProductAction } from "@/modules/platform/actions";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import {
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

async function moderateFormAction(formData: FormData) {
  "use server";
  await moderateProductAction(
    formData.get("productId") as string,
    formData.get("isActive") === "true"
  );
}

const moderationButtonClass =
  "inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Products"
        description="Moderate marketplace catalog — approve, hide, or restore products"
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Marketplace products awaiting moderation" minWidth="52rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Product</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Store</DashboardTableHeader>
              <DashboardTableHeader>Price</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Stock</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {products.length === 0 ? (
              <DashboardTableEmpty colSpan={6}>
                <DashboardEmptyState
                  inset
                  icon={<Package className="h-5 w-5" aria-hidden />}
                  title="No products to moderate"
                  description="Products published by merchants will appear here for review."
                />
              </DashboardTableEmpty>
            ) : (
              products.map((product) => {
                const store = product.store as { name?: string; status?: string } | null;
                return (
                  <DashboardTableRow key={product.id} interactive>
                    <DashboardTableCell wrap className="font-medium">
                      {product.name}
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="md" wrap>
                      {store?.name ?? "—"}
                      {store?.status !== "active" && (
                        <span className="ml-2 text-xs text-amber-400">({store?.status})</span>
                      )}
                    </DashboardTableCell>
                    <DashboardTableCell>
                      <CurrencyAmount amount={Number(product.price)} currency={product.currency} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="sm">{product.stock}</DashboardTableCell>
                    <DashboardTableCell>
                      {product.is_active ? (
                        <span className="text-emerald-400">Active</span>
                      ) : (
                        <span className="text-red-400">Hidden</span>
                      )}
                    </DashboardTableCell>
                    <DashboardTableCell align="right">
                      <form action={moderateFormAction} className="flex justify-end gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        {product.is_active ? (
                          <>
                            <input type="hidden" name="isActive" value="false" />
                            <button
                              type="submit"
                              className={`${moderationButtonClass} text-red-400 hover:text-red-300`}
                            >
                              Hide
                            </button>
                          </>
                        ) : (
                          <>
                            <input type="hidden" name="isActive" value="true" />
                            <button
                              type="submit"
                              className={`${moderationButtonClass} text-emerald-400 hover:text-emerald-300`}
                            >
                              Approve
                            </button>
                          </>
                        )}
                      </form>
                    </DashboardTableCell>
                  </DashboardTableRow>
                );
              })
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
