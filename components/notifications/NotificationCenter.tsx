"use client";

import Link from "next/link";
import type { Notification } from "@/types";
import { markNotificationReadAction } from "@/modules/notifications/actions";

const EVENT_LABELS: Record<string, string> = {
  order_created: "Order Created",
  payment_received: "Payment Received",
  payment_failed: "Payment Failed",
  order_shipped: "Order Shipped",
  order_delivered: "Order Delivered",
  refund_completed: "Refund Completed",
  back_in_stock: "Back In Stock",
  price_drop: "Price Drop",
  new_order: "New Order",
  low_stock: "Low Stock",
  new_review: "New Review",
  refund_request: "Refund Request",
  new_merchant: "New Merchant",
  new_store: "New Store",
  product_report: "Product Report",
  store_report: "Store Report",
  payment_issue: "Payment Issue",
  content_report: "Content Report",
};

type NotificationCenterProps = {
  notifications: Notification[];
  basePath: string;
};

function getEventLabel(notification: Notification): string {
  const event = notification.metadata?.event;
  if (typeof event === "string" && EVENT_LABELS[event]) {
    return EVENT_LABELS[event];
  }
  return notification.type;
}

function getNotificationLink(notification: Notification, basePath: string): string | null {
  const orderId = notification.metadata?.order_id;
  if (typeof orderId === "string") return `${basePath}/orders/${orderId}`;
  const invoiceId = notification.metadata?.invoice_id;
  if (typeof invoiceId === "string") return `${basePath}/invoices/${invoiceId}`;
  return null;
}

export function NotificationCenter({ notifications, basePath }: NotificationCenterProps) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/50 p-8 text-center text-muted">
        No notifications yet.
      </div>
    );
  }

  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const label = getEventLabel(n);
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} aria-labelledby={`notif-${category}`}>
          <h2 id={`notif-${category}`} className="text-xs font-semibold uppercase tracking-wider text-muted">
            {category}
          </h2>
          <div className="mt-3 space-y-3">
            {items.map((n) => {
              const link = getNotificationLink(n, basePath);
              return (
                <article
                  key={n.id}
                  className={`rounded-xl border p-4 ${n.read_at ? "border-border bg-surface/30" : "border-gold/30 bg-surface/60"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{n.title}</h3>
                      <p className="mt-1 text-sm text-muted">{n.body}</p>
                      <p className="mt-2 text-xs text-muted">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.read_at && (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <button type="submit" className="text-xs text-gold hover:underline">
                          Mark read
                        </button>
                      </form>
                    )}
                  </div>
                  {link && (
                    <Link href={link} className="mt-2 inline-block text-xs text-gold">
                      View details →
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
