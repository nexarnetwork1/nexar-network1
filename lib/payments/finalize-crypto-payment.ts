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
