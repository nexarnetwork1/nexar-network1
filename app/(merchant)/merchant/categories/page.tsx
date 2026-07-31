import Link from "next/link";
import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreCategories } from "@/modules/catalog/repository";
import { createCategoryAction } from "@/modules/catalog/actions";
import { CategoryRow } from "@/components/catalog/CategoryRow";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

async function createCategoryFormAction(formData: FormData) {
  "use server";
  const result = await createCategoryAction(formData);
  if (result.redirectTo) {
    const { redirect } = await import("next/navigation");
    redirect(result.redirectTo);
  }
}

export default async function MerchantCategoriesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/categories" }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const categories = await getStoreCategories(store.id);

  return (
    <div>
      <Link href="/merchant/products" className="text-sm text-muted hover:text-gold">
        ← Back to products
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-semibold">Categories</h1>
      <p className="mt-2 text-muted">Organize products in {store.name}</p>

      <form action={createCategoryFormAction} className="mt-8 flex max-w-md gap-3">
        <Input name="name" label="New category" placeholder="e.g. Electronics" required />
        <div className="flex items-end">
          <Button type="submit">Add</Button>
        </div>
      </form>

      <ul className="mt-8 space-y-2">
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
        {categories.length === 0 && (
          <li className="text-muted">No categories yet.</li>
        )}
      </ul>
    </div>
  );
}
