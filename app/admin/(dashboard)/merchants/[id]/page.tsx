import { notFound } from "next/navigation";
import { QrCode, ShoppingBag } from "lucide-react";
import { getMerchantDetail } from "@/modules/platform/repository";
import { updateStoreStatusAction, banUserAction, resetUserPasswordAction } from "@/modules/platform/actions";
import type { StoreStatus } from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
  dashboardFilterControlClass,
} from "@/components/dashboard";

type Props = { params: Promise<{ id: string }> };

async function updateStoreFormAction(formData: FormData) {
  "use server";
  await updateStoreStatusAction(formData.get("storeId") as string, formData.get("status") as StoreStatus);
}

async function banFormAction(formData: FormData) {
  "use server";
  await banUserAction(formData.get("userId") as string, true);
}

async function resetPasswordFormAction(formData: FormData) {
  "use server";
  await resetUserPasswordAction(formData.get("userId") as string);
}

export default async function AdminMerchantDetailPage({ params }: Props) {
  const { id } = await params;
  const store = await getMerchantDetail(id);
  if (!store) notFound();

  const owner = store.owner as { id: string; full_name: string | null; email: string; wallet_address: string | null };
  const mp = store.merchant_profile as { total_revenue_usd?: number; total_orders?: number } | null;
  const qrCodes = (store.qr_codes ?? []) as Array<{ id: string; qr_type: string; payload: string; is_active: boolean }>;

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, status, subtotal, created_at")
    .eq("store_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentOrders = orders ?? [];

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title={store.name}
        headingClassName="text-gold"
        description={
          <span className="capitalize">
            {store.mode.replace("_", " ")} · {store.status}
          </span>
        }
      />

      <DashboardStats columns={3}>
        <DashboardStat label="Revenue" value={`$${Number(mp?.total_revenue_usd ?? 0).toFixed(2)}`} />
        <DashboardStat label="Orders" value={String(mp?.total_orders ?? 0)} />
        <DashboardStat label="Owner" value={owner?.full_name ?? owner?.email ?? "—"} />
      </DashboardStats>

      <DashboardCard as="section">
        <h2 className="font-heading text-lg font-semibold text-gold">Wallet &amp; QR codes</h2>
        <p className="mt-2 break-all font-mono text-sm">{store.wallet_address}</p>
        {qrCodes.length === 0 ? (
          <DashboardEmptyState
            inset
            icon={<QrCode className="h-5 w-5" aria-hidden />}
            title="No QR codes"
            description="Payment and storefront QR codes generated for this merchant will appear here."
          />
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {qrCodes.map((qr) => (
              <li key={qr.id} className="flex flex-wrap justify-between gap-2">
                <span className="capitalize">{qr.qr_type.replace("_", " ")}</span>
                <span className="max-w-full truncate font-mono text-xs text-muted sm:max-w-md">
                  {qr.payload}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardCard as="section">
        <h2 className="font-heading text-lg font-semibold text-gold">Recent orders</h2>
        {recentOrders.length === 0 ? (
          <DashboardEmptyState
            inset
            icon={<ShoppingBag className="h-5 w-5" aria-hidden />}
            title="No orders yet"
            description="Orders placed with this merchant will be listed here."
          />
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-2">
                <span className="font-mono text-xs sm:text-sm">{o.id.slice(0, 8)}…</span>
                <span>
                  ${Number(o.subtotal).toFixed(2)} · <span className="capitalize">{o.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardSection level="h3" title="Merchant actions">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <form
            action={updateStoreFormAction}
            className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
          >
            <input type="hidden" name="storeId" value={store.id} />
            <label htmlFor="store-status" className="sr-only">
              Store status
            </label>
            <select
              id="store-status"
              name="status"
              defaultValue={store.status}
              className={`${dashboardFilterControlClass} w-full sm:w-auto`}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button type="submit" className="w-full sm:w-auto">
              Update status
            </Button>
          </form>
          {owner?.id && (
            <>
              <form action={resetPasswordFormAction} className="w-full sm:w-auto">
                <input type="hidden" name="userId" value={owner.id} />
                <Button type="submit" variant="outline" className="w-full text-gold sm:w-auto">
                  Reset password
                </Button>
              </form>
              <form action={banFormAction} className="w-full sm:w-auto">
                <input type="hidden" name="userId" value={owner.id} />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-red-500/40 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 sm:w-auto"
                >
                  Ban merchant
                </Button>
              </form>
            </>
          )}
        </div>
      </DashboardSection>
    </div>
  );
}
