import { BadgePercent } from "lucide-react";
import { getAllPromotions } from "@/modules/platform/repository";
import { togglePromotionAction } from "@/modules/platform/actions";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

async function togglePromoFormAction(formData: FormData) {
  "use server";
  const id = formData.get("promotionId") as string;
  const isActive = formData.get("isActive") === "true";
  await togglePromotionAction(id, isActive);
}

export default async function AdminPromotionsPage() {
  const promotions = await getAllPromotions();

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Promotions"
        headingClassName="text-gold"
        description="New merchant discount: 50% off platform fees for first 3 months (auto-created on store activation)"
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Merchant promotions" minWidth="42rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Store</DashboardTableHeader>
              <DashboardTableHeader>Discount</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Starts</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Expires</DashboardTableHeader>
              <DashboardTableHeader>Active</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {promotions.length === 0 ? (
              <DashboardTableEmpty colSpan={6}>
                <DashboardEmptyState
                  inset
                  icon={<BadgePercent className="h-5 w-5" aria-hidden />}
                  title="No promotions yet"
                  description="Fee discounts created for merchants will be listed here."
                />
              </DashboardTableEmpty>
            ) : (
              promotions.map((p) => {
                const expired = new Date(p.expires_at) < new Date();
                const storeName = (p.store as { name?: string })?.name ?? "—";
                return (
                  <DashboardTableRow key={p.id} interactive>
                    <DashboardTableCell wrap>{storeName}</DashboardTableCell>
                    <DashboardTableCell>{Number(p.discount_percent)}%</DashboardTableCell>
                    <DashboardTableCell hideBelow="md" className="text-muted">
                      {new Date(p.starts_at).toLocaleDateString()}
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="sm">
                      <span className={expired ? "text-red-400" : "text-muted"}>
                        {new Date(p.expires_at).toLocaleDateString()}
                        {expired && " (expired)"}
                      </span>
                    </DashboardTableCell>
                    <DashboardTableCell>
                      {p.is_active ? (
                        <span className="text-emerald-400">Yes</span>
                      ) : (
                        <span className="text-muted">No</span>
                      )}
                    </DashboardTableCell>
                    <DashboardTableCell align="right">
                      <form action={togglePromoFormAction} className="flex justify-end">
                        <input type="hidden" name="promotionId" value={p.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(!p.is_active)}
                        />
                        <button
                          type="submit"
                          aria-label={`${p.is_active ? "Deactivate" : "Activate"} promotion for ${storeName}`}
                          className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-gold transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                        >
                          {p.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </DashboardTableCell>
                  </DashboardTableRow>
                );
              })
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
