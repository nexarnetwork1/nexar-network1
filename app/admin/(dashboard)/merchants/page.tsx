import Link from "next/link";
import { getAllStores } from "@/modules/platform/repository";
import { updateStoreStatusAction, banUserAction } from "@/modules/platform/actions";
import { ExportButton } from "@/components/admin/ExportButton";
import type { StoreStatus } from "@/types";

async function updateStoreFormAction(formData: FormData) {
  "use server";
  const storeId = formData.get("storeId") as string;
  const status = formData.get("status") as StoreStatus;
  await updateStoreStatusAction(storeId, status);
}

async function banOwnerFormAction(formData: FormData) {
  "use server";
  await banUserAction(formData.get("userId") as string, true);
}

export default async function AdminMerchantsPage() {
  const stores = await getAllStores();
  const pendingCount = stores.filter((s) => s.status === "pending").length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Merchants</h1>
          <p className="mt-2 text-zinc-400">
            {stores.length} stores
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-400">· {pendingCount} awaiting approval</span>
            )}
          </p>
        </div>
        <ExportButton resource="merchants" />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/merchants/${store.id}`} className="hover:text-yellow-400">
                    {store.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {(store.owner as { full_name?: string; email?: string })?.full_name ??
                    (store.owner as { email?: string })?.email ??
                    "—"}
                </td>
                <td className="px-4 py-3 capitalize">{store.mode.replace("_", " ")}</td>
                <td className="px-4 py-3 capitalize">
                  <span
                    className={
                      store.status === "pending"
                        ? "text-amber-400"
                        : store.status === "active"
                          ? "text-emerald-400"
                          : "text-red-400"
                    }
                  >
                    {store.status}
                  </span>
                </td>
                <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs">
                  {store.wallet_address}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={updateStoreFormAction} className="flex items-center gap-2">
                      <input type="hidden" name="storeId" value={store.id} />
                      <select
                        name="status"
                        defaultValue={store.status}
                        className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <button type="submit" className="text-xs text-yellow-400 hover:underline">
                        Update
                      </button>
                    </form>
                    {(store.owner as { id?: string })?.id && (
                      <form action={banOwnerFormAction}>
                        <input type="hidden" name="userId" value={(store.owner as { id: string }).id} />
                        <button type="submit" className="text-xs text-red-400 hover:underline">
                          Ban owner
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
