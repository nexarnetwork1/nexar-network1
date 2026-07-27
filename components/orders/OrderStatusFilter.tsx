"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { OrderStatus } from "@/types";

const FILTERS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending", statuses: ["pending_payment"] },
  { key: "paid", label: "Paid", statuses: ["paid"] },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled", "expired"] },
  { key: "refunded", label: "Refunded", statuses: ["refunded"] },
];

export function OrderStatusFilter() {
  const searchParams = useSearchParams();
  const active = searchParams.get("status") ?? "all";

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filter orders by status">
      {FILTERS.map((filter) => (
        <Link
          key={filter.key}
          href={filter.key === "all" ? "/customer/orders" : `/customer/orders?status=${filter.key}`}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            active === filter.key
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-border text-muted hover:text-white"
          }`}
          aria-current={active === filter.key ? "page" : undefined}
        >
          {filter.label}
        </Link>
      ))}
    </nav>
  );
}

export function filterOrdersByStatus<T extends { status: OrderStatus; fulfillment_status?: string }>(
  orders: T[],
  filterKey: string | null
): T[] {
  if (!filterKey || filterKey === "all") return orders;

  if (filterKey === "processing") {
    return orders.filter((o) => o.status === "paid" && o.fulfillment_status === "processing");
  }
  if (filterKey === "shipped") {
    return orders.filter((o) => o.status === "paid" && o.fulfillment_status === "shipped");
  }
  if (filterKey === "delivered") {
    return orders.filter((o) => o.status === "paid" && o.fulfillment_status === "delivered");
  }

  const filter = FILTERS.find((f) => f.key === filterKey);
  if (!filter?.statuses?.length) return orders;
  return orders.filter((o) => filter.statuses!.includes(o.status));
}
