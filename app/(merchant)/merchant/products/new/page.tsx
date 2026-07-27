import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { createProductAction } from "@/modules/catalog/actions";
import { ProductForm } from "@/components/catalog/ProductForm";

export default async function NewProductPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant/products");

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
        <ProductForm action={createProductAction} submitLabel="Create product" />
      </div>
    </div>
  );
}
