import Link from "next/link";
import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreCategories } from "@/modules/catalog/repository";
import { createProductAction } from "@/modules/catalog/actions";
import { ProductForm } from "@/components/catalog/ProductForm";

export default async function NewProductPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/products/new" }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant/products");

  const categories = await getStoreCategories(store.id);

  return (
    <div>
      <Link
        href="/merchant/products"
        className="text-sm text-muted hover:text-gold"
      >
        ← Back to products
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-semibold">Add product</h1>
      <div className="mt-8">
        <ProductForm
          action={createProductAction}
          categories={categories}
          submitLabel="Create product"
        />
      </div>
    </div>
  );
}
