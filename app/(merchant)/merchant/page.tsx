import { getCurrentProfile } from "@/modules/users/repository";
import { createClient } from "@/lib/supabase/server";

export default async function MerchantDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("name, status, mode")
    .eq("owner_id", profile?.id ?? "")
    .single();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">
        {store?.name ?? "Merchant Dashboard"}
      </h1>
      <p className="mt-2 text-muted">
        Manage products, orders, and payments.
      </p>
      {store && (
        <div className="mt-6 flex gap-4 text-sm">
          <span className="rounded-full border border-border px-3 py-1 capitalize">
            {store.status}
          </span>
          <span className="rounded-full border border-border px-3 py-1 capitalize">
            {store.mode.replace("_", " ")}
          </span>
        </div>
      )}
    </div>
  );
}
