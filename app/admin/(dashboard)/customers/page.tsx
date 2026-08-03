import Link from "next/link";
import { Users } from "lucide-react";
import { getCustomers } from "@/modules/platform/repository";
import { banUserAction, resetUserPasswordAction } from "@/modules/platform/actions";
import { ExportButton } from "@/components/admin/ExportButton";
import { formatDateTime } from "@/utils/format";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
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

const rowActionClass =
  "inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

async function banFormAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  const ban = formData.get("ban") === "true";
  await banUserAction(userId, ban);
}

async function resetPasswordFormAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  await resetUserPasswordAction(userId);
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Customers"
        description={`${customers.length} registered customers`}
        actions={
          <DashboardActions>
            <ExportButton resource="customers" />
          </DashboardActions>
        }
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Registered customers" minWidth="56rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Customer</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Orders</DashboardTableHeader>
              <DashboardTableHeader>Spent</DashboardTableHeader>
              <DashboardTableHeader hideBelow="lg">Wallet</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Joined</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {customers.length === 0 ? (
              <DashboardTableEmpty colSpan={6}>
                <DashboardEmptyState
                  inset
                  icon={<Users className="h-5 w-5" aria-hidden />}
                  title="No customers yet"
                  description="Customers appear here as soon as they register on the marketplace."
                />
              </DashboardTableEmpty>
            ) : (
              customers.map((customer) => {
                const cp = customer.customer_profile as {
                  total_orders?: number;
                  total_spent_usd?: number;
                } | null;

                return (
                  <DashboardTableRow key={customer.id} interactive>
                    <DashboardTableCell wrap>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-medium hover:text-gold"
                      >
                        {customer.full_name ?? customer.email}
                      </Link>
                      <p className="text-xs text-muted">{customer.email}</p>
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="md">{cp?.total_orders ?? 0}</DashboardTableCell>
                    <DashboardTableCell>
                      <UsdAmount amount={Number(cp?.total_spent_usd ?? 0)} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell
                      hideBelow="lg"
                      className="max-w-[10rem] truncate font-mono text-xs text-muted"
                    >
                      {customer.wallet_address ?? "—"}
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="sm" className="text-muted">
                      {formatDateTime(customer.created_at)}
                    </DashboardTableCell>
                    <DashboardTableCell align="right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <form action={resetPasswordFormAction}>
                          <input type="hidden" name="userId" value={customer.id} />
                          <button
                            type="submit"
                            className={`${rowActionClass} text-gold hover:underline`}
                          >
                            Reset password
                          </button>
                        </form>
                        <form action={banFormAction}>
                          <input type="hidden" name="userId" value={customer.id} />
                          <input type="hidden" name="ban" value="true" />
                          <button
                            type="submit"
                            className={`${rowActionClass} text-red-400 hover:underline`}
                          >
                            Ban
                          </button>
                        </form>
                      </div>
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
