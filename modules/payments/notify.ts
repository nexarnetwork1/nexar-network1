import { enqueueWebhookDelivery } from "@/modules/webhooks/repository";
import { dispatchNotification } from "@/modules/notifications/dispatch";
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

  const store = await getStoreById(order.store_id);
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", [order.customer_id, store?.owner_id].filter(Boolean) as string[]);

  const customer = profiles?.find((p) => p.id === order.customer_id);
  const merchant = profiles?.find((p) => p.id === store?.owner_id);

  await dispatchNotification({
    event: "payment.received",
    userId: order.customer_id,
    title: "Payment confirmed",
    body: `Your payment of $${params.amountUsd.toFixed(2)} was received.`,
    type: "payment",
    metadata: { order_id: params.orderId, session_id: params.sessionId },
    email: customer?.email ? { to: customer.email } : undefined,
  }).catch(() => undefined);

  if (store) {
    await dispatchNotification({
      event: "payment.received",
      userId: store.owner_id,
      title: "New payment received",
      body: `Order ${params.orderId.slice(0, 8)}… paid${params.merchantAmount ? ` — $${params.merchantAmount.toFixed(2)} net` : ""}.`,
      type: "payment",
      metadata: { order_id: params.orderId, session_id: params.sessionId },
      email: merchant?.email ? { to: merchant.email } : undefined,
    }).catch(() => undefined);

    await enqueueWebhookDelivery({
      storeId: store.id,
      event: "payment.success",
      payload: {
        order_id: params.orderId,
        session_id: params.sessionId,
        amount_usd: params.amountUsd,
        merchant_amount: params.merchantAmount,
      },
    }).catch(() => undefined);
  }

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
