import { createNotification } from "@/modules/notifications/repository";
import { getOrderById } from "@/modules/orders/repository";
import { getStoreById } from "@/modules/stores/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentReceivedEmail } from "@/lib/email/send";

export async function notifyPaymentCompleted(params: {
  sessionId: string;
  orderId: string;
  amountUsd: number;
  merchantAmount?: number;
}): Promise<void> {
  const order = await getOrderById(params.orderId);
  if (!order) return;

  await createNotification({
    userId: order.customer_id,
    type: "payment",
    title: "Payment confirmed",
    body: `Your payment of $${params.amountUsd.toFixed(2)} was received.`,
    metadata: { order_id: params.orderId, session_id: params.sessionId },
  }).catch(() => undefined);

  const store = await getStoreById(order.store_id);
  if (store) {
    await createNotification({
      userId: store.owner_id,
      type: "payment",
      title: "New payment received",
      body: `Order ${params.orderId.slice(0, 8)}… paid${params.merchantAmount ? ` — $${params.merchantAmount.toFixed(2)} net` : ""}.`,
      metadata: { order_id: params.orderId, session_id: params.sessionId },
    }).catch(() => undefined);
  }

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", [order.customer_id, store?.owner_id].filter(Boolean) as string[]);

  const customer = profiles?.find((p) => p.id === order.customer_id);
  const merchant = profiles?.find((p) => p.id === store?.owner_id);

  if (customer?.email) {
    await sendPaymentReceivedEmail({
      to: customer.email,
      recipientName: customer.full_name ?? "Customer",
      amount: params.amountUsd,
      role: "customer",
    }).catch(() => undefined);
  }

  if (merchant?.email) {
    await sendPaymentReceivedEmail({
      to: merchant.email,
      recipientName: merchant.full_name ?? "Merchant",
      amount: params.merchantAmount ?? params.amountUsd,
      role: "merchant",
    }).catch(() => undefined);
  }
}
