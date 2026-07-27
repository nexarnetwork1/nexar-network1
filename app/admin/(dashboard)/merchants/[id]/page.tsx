import Link from "next/link";
import { notFound } from "next/navigation";
import { getMerchantDetail } from "@/modules/platform/repository";
import { updateStoreStatusAction, banUserAction, resetUserPasswordAction } from "@/modules/platform/actions";
import type { StoreStatus } from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";

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

  return (
    <div>
      <Link href="/admin/merchants" className="text-sm text-yellow-400 hover:underline">← Merchants</Link>
      <h1 className="mt-4 text-3xl font-bold text-yellow-400">{store.name}</h1>
      <p className="mt-2 capitalize text-zinc-400">{store.mode.replace("_", " ")} · {store.status}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue" value={`$${Number(mp?.total_revenue_usd ?? 0).toFixed(2)}`} />
        <Stat label="Orders" value={String(mp?.total_orders ?? 0)} />
        <Stat label="Owner" value={owner?.full_name ?? owner?.email ?? "—"} />
      </div>

      <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">Wallet & QR codes</h2>
        <p className="mt-2 font-mono text-sm">{store.wallet_address}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {qrCodes.map((qr) => (
            <li key={qr.id} className="flex justify-between">
              <span className="capitalize">{qr.qr_type.replace("_", " ")}</span>
              <span className="max-w-md truncate font-mono text-xs text-zinc-400">{qr.payload}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">Recent orders</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(orders ?? []).map((o) => (
            <li key={o.id} className="flex justify-between">
              <span>{o.id.slice(0, 8)}…</span>
              <span>${Number(o.subtotal).toFixed(2)} · {o.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <form action={updateStoreFormAction} className="flex items-center gap-2">
          <input type="hidden" name="storeId" value={store.id} />
          <select name="status" defaultValue={store.status} className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm">
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button type="submit" className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black">Update status</button>
        </form>
        {owner?.id && (
          <>
            <form action={resetPasswordFormAction}>
              <input type="hidden" name="userId" value={owner.id} />
              <button type="submit" className="rounded-lg border border-yellow-500/30 px-4 py-2 text-sm text-yellow-400">Reset password</button>
            </form>
            <form action={banFormAction}>
              <input type="hidden" name="userId" value={owner.id} />
              <button type="submit" className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400">Ban merchant</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
