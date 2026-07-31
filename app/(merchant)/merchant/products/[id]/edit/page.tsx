import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getProductById, getStoreCategories } from "@/modules/catalog/repository";
import { updateProductAction } from "@/modules/catalog/actions";
import { ProductForm } from "@/components/catalog/ProductForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: `/merchant/products/${id}/edit` }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant/products");

  const product = await getProductById(id);
  if (!product || product.store_id !== store.id) notFound();

  const categories = await getStoreCategories(store.id);
  const boundUpdate = updateProductAction.bind(null, id);

  return (
    <div>
      <Link
        href="/merchant/products"
        className="text-sm text-muted hover:text-gold"
      >
        ← Back to products
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-semibold">Edit product</h1>
      <div className="mt-8">
        <ProductForm
          action={boundUpdate}
          product={product}
          categories={categories}
          submitLabel="Update product"
        />
      </div>
    </div>
  );
}
