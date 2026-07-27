import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getProductById } from "@/modules/catalog/repository";
import { updateProductAction } from "@/modules/catalog/actions";
import { ProductForm } from "@/components/catalog/ProductForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant/products");

  const product = await getProductById(id);
  if (!product || product.store_id !== store.id) notFound();

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
          submitLabel="Update product"
        />
      </div>
    </div>
  );
}
