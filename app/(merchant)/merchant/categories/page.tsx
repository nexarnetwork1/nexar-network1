import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreCategories } from "@/modules/catalog/repository";
import { createCategoryAction } from "@/modules/catalog/actions";
import { CategoryRow } from "@/components/catalog/CategoryRow";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
} from "@/components/dashboard";

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
  if (!profile) {
  redirect("/login?redirect=/merchant/categories");
}

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const categories = await getStoreCategories(store.id);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Categories"
        description={`Organize products in ${store.name}`}
      />

      <DashboardSection title="Add a category" level="h3">
        <DashboardCard className="max-w-md">
          <form
            action={createCategoryFormAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 sm:flex-1">
              <Input
                name="name"
                label="New category"
                placeholder="e.g. Electronics"
                required
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Add
            </Button>
          </form>
        </DashboardCard>
      </DashboardSection>

      <DashboardSection title="Your categories" level="h3">
        {categories.length === 0 ? (
          <DashboardEmptyState
            icon={<Layers className="h-5 w-5" aria-hidden />}
            title="No categories yet"
            description="Group your products so shoppers can browse your catalog more easily."
          />
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
