import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { requireSuperAdmin } from "@/modules/users/repository";
import { getOrderById } from "@/modules/orders/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  await requireSuperAdmin();

  const order = await getOrderById(id);
  if (!order) notFound();

  const invoice = order.invoice;

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title={`Order ${order.id.slice(0, 8)}…`}
        actions={<StatusBadge status={order.status} />}
      />

      <DashboardStats columns={4}>
        <DashboardStat label="Store" value={order.store.name} />
        <DashboardStat
          label="Subtotal"
          value={
            <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
          }
        />
        <DashboardStat
          label="Platform fee"
          tone="gold"
          value={
            <CurrencyAmount
              amount={Number(order.platform_fee)}
              currency={order.currency}
              size={16}
            />
          }
        />
        {invoice && (
          <DashboardStat
            label="Invoice"
            value={<span className="font-mono text-base">{invoice.invoice_number}</span>}
          />
        )}
      </DashboardStats>

      <DashboardSection as="section" level="h2" title="Items">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Items in this order" minWidth="32rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Product</DashboardTableHeader>
                <DashboardTableHeader>Qty</DashboardTableHeader>
                <DashboardTableHeader>Line total</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {order.items.length === 0 ? (
                <DashboardTableEmpty colSpan={3}>
                  <DashboardEmptyState
                    inset
                    icon={<PackageOpen className="h-5 w-5" aria-hidden />}
                    title="No line items"
                    description="This order was created without any product line items."
                  />
                </DashboardTableEmpty>
              ) : (
                order.items.map((item) => (
                  <DashboardTableRow key={item.id} interactive>
                    <DashboardTableCell wrap>{item.product_name}</DashboardTableCell>
                    <DashboardTableCell>{item.quantity}</DashboardTableCell>
                    <DashboardTableCell>
                      <CurrencyAmount
                        amount={Number(item.line_total)}
                        currency={order.currency}
                        size={16}
                      />
                    </DashboardTableCell>
                  </DashboardTableRow>
                ))
              )}
            </DashboardTableBody>
          </DashboardTable>
        </DashboardCard>
      </DashboardSection>
    </div>
  );
}
