import { getAllPromotions } from "@/modules/platform/repository";
import { togglePromotionAction } from "@/modules/platform/actions";

async function togglePromoFormAction(formData: FormData) {
  "use server";
  const id = formData.get("promotionId") as string;
  const isActive = formData.get("isActive") === "true";
  await togglePromotionAction(id, isActive);
}

export default async function AdminPromotionsPage() {
  const promotions = await getAllPromotions();

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Promotions</h1>
      <p className="mt-2 text-zinc-400">
        New merchant discount: 50% off platform fees for first 3 months (auto-created on store activation)
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => {
              const expired = new Date(p.expires_at) < new Date();
              return (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    {(p.store as { name?: string })?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{Number(p.discount_percent)}%</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(p.starts_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={expired ? "text-red-400" : "text-zinc-400"}>
                      {new Date(p.expires_at).toLocaleDateString()}
                      {expired && " (expired)"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <span className="text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-zinc-500">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action={togglePromoFormAction}>
                      <input type="hidden" name="promotionId" value={p.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={String(!p.is_active)}
                      />
                      <button type="submit" className="text-xs text-yellow-400 hover:underline">
                        {p.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
