import { Users } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreCustomers } from "@/modules/stores/repository";
import { formatDateTime } from "@/utils/format";
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

export default async function MerchantCustomersPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const store = await getMerchantStore(profile.id);
  if (!store) {
    return (
      <DashboardSection
        as="div"
        level="h1"
        title="Customers"
        headingClassName="text-gold"
        description="Complete store setup to view customers."
      />
    );
  }

  const customers = await getStoreCustomers(store.id);

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Customers"
        headingClassName="text-gold"
        description={`Customers who have ordered from ${store.name}`}
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Store customers" minWidth="40rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Customer</DashboardTableHeader>
              <DashboardTableHeader>Email</DashboardTableHeader>
              <DashboardTableHeader>Orders</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Since</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {customers.length === 0 ? (
              <DashboardTableEmpty colSpan={4}>
                <DashboardEmptyState
                  inset
                  icon={<Users className="h-5 w-5" aria-hidden />}
                  title="No customers yet"
                  description="People who order from your store will appear here."
                />
              </DashboardTableEmpty>
            ) : (
              customers.map((customer) => (
                <DashboardTableRow key={customer.id} interactive>
                  <DashboardTableCell className="font-medium">
                    {customer.full_name ?? "—"}
                  </DashboardTableCell>
                  <DashboardTableCell>{customer.email}</DashboardTableCell>
                  <DashboardTableCell>{customer.order_count}</DashboardTableCell>
                  <DashboardTableCell hideBelow="sm" className="text-muted">
                    {formatDateTime(customer.created_at)}
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
