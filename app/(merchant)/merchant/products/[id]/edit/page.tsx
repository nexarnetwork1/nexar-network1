import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getProductById, getStoreCategories } from "@/modules/catalog/repository";
import { updateProductAction } from "@/modules/catalog/actions";
import { ProductForm } from "@/components/catalog/ProductForm";
import { DashboardSection } from "@/components/dashboard";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
 if (!profile) {
  redirect("/login?redirect=" + encodeURIComponent(`/merchant/products/${id}/edit`));
}

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant/products");

  const product = await getProductById(id);
  if (!product || product.store_id !== store.id) notFound();

  const categories = await getStoreCategories(store.id);
  const boundUpdate = updateProductAction.bind(null, id);

  return (
    <div className="space-y-6">
      <DashboardSection as="div" level="h1" title="Edit product" />

      <ProductForm
        action={boundUpdate}
        product={product}
        categories={categories}
        submitLabel="Update product"
      />
    </div>
  );
}
