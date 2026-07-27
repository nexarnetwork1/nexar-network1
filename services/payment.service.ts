import { BaseService } from "./base.service";
import { finalizeCryptoPayment } from "@/lib/payments/finalize-crypto-payment";

/**
 * Payment orchestration facade.
 * Chain verification: lib/blockchain/
 * DB completion: lib/payments/finalize-crypto-payment.ts
 * On-chain settlement: modules/settlement/worker.ts (after escrow release)
 * Server actions: modules/payments/actions.ts
 */
export class PaymentService extends BaseService {
  /** Complete a verified crypto session in the database. */
  finalizeCryptoPayment = finalizeCryptoPayment;
}

export const paymentService = new PaymentService();
