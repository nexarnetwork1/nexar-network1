import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderById } from "@/modules/orders/repository";
import { notifyPaymentCompleted } from "@/modules/payments/notify";

export type FinalizeCryptoPaymentResult =
  | {
      success: true;
      settlementId: string;
      orderId: string;
      platformFee: number;
      merchantAmount: number;
      txHash: string;
    }
  | { success: false; error: string };

/** Complete a verified crypto payment session in the database. On-chain settlement runs after escrow release. */
export async function finalizeCryptoPayment(params: {
  sessionId: string;
  txHash: string;
  verifiedAmount: number;
}): Promise<FinalizeCryptoPaymentResult> {
  const admin = createAdminClient();
  const { data: result, error: completeError } = await admin.rpc("complete_payment", {
    p_session_id: params.sessionId,
    p_tx_hash: params.txHash,
    p_verified_amount: params.verifiedAmount,
  });

  if (completeError) {
    return { success: false, error: completeError.message };
  }

  const settlement = result as {
    settlement_id: string;
    order_id: string;
    platform_fee: number;
    merchant_amount: number;
  };

  const order = await getOrderById(settlement.order_id);
  if (order) {
    await notifyPaymentCompleted({
      sessionId: params.sessionId,
      orderId: settlement.order_id,
      amountUsd: Number(order.subtotal),
      merchantAmount: settlement.merchant_amount,
    }).catch(() => undefined);

    // ATLAS Core integration — publish domain events so peer modules + core spine react
    try {
      const { randomUUID } = await import("node:crypto");
      const { publishDomainEvent } = await import("@/domains/events/bus");
      const amount = Number(order.subtotal);
      const store = (order as { store?: { business_id?: string | null } }).store;
      const businessId =
        (order as { business_id?: string }).business_id ??
        store?.business_id ??
        null;
      const payload = {
        orderId: settlement.order_id,
        sessionId: params.sessionId,
        amount,
        currency: (order as { currency?: string }).currency ?? "USD",
        customerId: (order as { customer_id?: string }).customer_id ?? null,
        storeId: (order as { store_id?: string }).store_id ?? null,
        settlementId: settlement.settlement_id,
      };
      await publishDomainEvent({
        id: randomUUID(),
        name: "payment.confirmed",
        occurredAt: new Date(),
        actorId: (order as { customer_id?: string }).customer_id ?? null,
        businessId,
        payload,
        correlationId: randomUUID(),
      });
      await publishDomainEvent({
        id: randomUUID(),
        name: "order.paid",
        occurredAt: new Date(),
        actorId: (order as { customer_id?: string }).customer_id ?? null,
        businessId,
        payload,
        correlationId: randomUUID(),
      });
    } catch {
      /* non-fatal */
    }
  }

  return {
    success: true,
    settlementId: settlement.settlement_id,
    orderId: settlement.order_id,
    platformFee: settlement.platform_fee,
    merchantAmount: settlement.merchant_amount,
    txHash: params.txHash,
  };
}
