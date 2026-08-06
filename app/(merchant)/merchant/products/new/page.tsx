import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreCategories } from "@/modules/catalog/repository";
import { createProductAction } from "@/modules/catalog/actions";
import { ProductForm } from "@/components/catalog/ProductForm";
import { DashboardSection } from "@/components/dashboard";

export default async function NewProductPage() {
  const profile = await getCurrentProfile();
 if (!profile) {
  redirect("/login?redirect=/merchant/products/new");
}

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant/products");

  const categories = await getStoreCategories(store.id);

  return (
    <div className="space-y-6">
      <DashboardSection as="div" level="h1" title="Add product" />

      <ProductForm
        action={createProductAction}
        categories={categories}
        submitLabel="Create product"
      />
    </div>
  );
}
