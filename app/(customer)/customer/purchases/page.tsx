import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerPurchaseHistory } from "@/modules/wallet/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/utils/format";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
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

export default async function CustomerPurchaseHistoryPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/customer/purchases" }));

  const purchases = await getCustomerPurchaseHistory(profile.id);

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Purchase history"
        description="Completed orders and payments"
        actions={
          <Link href="/customer/orders" className="text-sm text-gold hover:underline">
            View all orders →
          </Link>
        }
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Completed purchases" minWidth="40rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Date</DashboardTableHeader>
              <DashboardTableHeader>Store</DashboardTableHeader>
              <DashboardTableHeader>Amount</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {purchases.length === 0 ? (
              <DashboardTableEmpty colSpan={4}>
                <DashboardEmptyState
                  inset
                  icon={<ClipboardList className="h-5 w-5" aria-hidden />}
                  title="No completed purchases yet"
                  description="Once an order is paid it will be listed here."
                />
              </DashboardTableEmpty>
            ) : (
              purchases.map((row) => (
                <DashboardTableRow key={row.order_id} interactive>
                  <DashboardTableCell className="text-muted">
                    {formatDateTime(row.paid_at ?? row.created_at)}
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <Link href={`/customer/orders/${row.order_id}`} className="hover:text-gold">
                      {row.store_name}
                    </Link>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <UsdAmount amount={Number(row.total)} size={16} />
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <StatusBadge status={row.status} />
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
