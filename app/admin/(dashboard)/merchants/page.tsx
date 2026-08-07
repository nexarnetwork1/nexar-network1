import Link from "next/link";
import { Store } from "lucide-react";
import { getAllStores } from "@/modules/platform/repository";
import { updateStoreStatusAction, banUserAction } from "@/modules/platform/actions";
import { ExportButton } from "@/components/admin/ExportButton";
import {
  DashboardActions,
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
import type { StoreStatus } from "@/types";

const rowActionClass =
  "inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

const statusSelectClass =
  "h-11 min-w-0 rounded-xl border border-border bg-surface/60 px-3 text-xs text-white focus:border-gold/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

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
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Merchants"
        description={
          <>
            {stores.length} stores
            {pendingCount > 0 && (
              <span className="ml-2 text-gold">· {pendingCount} awaiting approval</span>
            )}
          </>
        }
        actions={
          <DashboardActions>
            <ExportButton resource="merchants" />
          </DashboardActions>
        }
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Merchant stores" minWidth="60rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Store</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Owner</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Mode</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="lg">Wallet</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {stores.length === 0 ? (
              <DashboardTableEmpty colSpan={6}>
                <DashboardEmptyState
                  inset
                  icon={<Store className="h-5 w-5" aria-hidden />}
                  title="No stores yet"
                  description="Merchant stores appear here once someone signs up to sell."
                />
              </DashboardTableEmpty>
            ) : (
              stores.map((store) => (
                <DashboardTableRow key={store.id} interactive>
                  <DashboardTableCell wrap className="font-medium">
                    <Link href={`/admin/merchants/${store.id}`} className="hover:text-gold">
                      {store.name}
                    </Link>
                  </DashboardTableCell>
                  <DashboardTableCell wrap hideBelow="md">
                    {(store.owner as { full_name?: string; email?: string })?.full_name ??
                      (store.owner as { email?: string })?.email ??
                      "—"}
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="md" className="capitalize">
                    {store.mode.replace("_", " ")}
                  </DashboardTableCell>
                  <DashboardTableCell className="capitalize">
                    <span
                      className={
                        store.status === "pending"
                          ? "text-gold"
                          : store.status === "active"
                            ? "text-emerald-400"
                            : "text-red-400"
                      }
                    >
                      {store.status}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell
                    hideBelow="lg"
                    className="max-w-[10rem] truncate font-mono text-xs text-muted"
                  >
                    {store.wallet_address}
                  </DashboardTableCell>
                  <DashboardTableCell align="right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <form action={updateStoreFormAction} className="flex items-center gap-2">
                        <input type="hidden" name="storeId" value={store.id} />
                        <label className="sr-only" htmlFor={`status-${store.id}`}>
                          Store status
                        </label>
                        <select
                          id={`status-${store.id}`}
                          name="status"
                          defaultValue={store.status}
                          className={statusSelectClass}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                        <button
                          type="submit"
                          className={`${rowActionClass} text-gold hover:underline`}
                        >
                          Update
                        </button>
                      </form>
                      {(store.owner as { id?: string })?.id && (
                        <form action={banOwnerFormAction}>
                          <input
                            type="hidden"
                            name="userId"
                            value={(store.owner as { id: string }).id}
                          />
                          <button
                            type="submit"
                            className={`${rowActionClass} text-red-400 hover:underline`}
                          >
                            Ban owner
                          </button>
                        </form>
                      )}
                    </div>
                  </DashboardTableCell>
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
