import type { InvoiceItem } from "@/types";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

type InvoiceItemsTableProps = {
  items: InvoiceItem[];
  currency?: string;
};

export function InvoiceItemsTable({ items, currency = "USD" }: InvoiceItemsTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card/60 text-left text-muted">
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Unit price</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/50">
              <td className="px-4 py-3">{item.product_name}</td>
              <td className="px-4 py-3 text-right">{item.quantity}</td>
              <td className="px-4 py-3 text-right">
                <CurrencyAmount amount={Number(item.unit_price)} currency={currency} size={16} />
              </td>
              <td className="px-4 py-3 text-right">
                <CurrencyAmount amount={Number(item.line_total)} currency={currency} size={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
