import type { CheckoutSessionDraft } from "../../shared/types";

export interface CheckoutRepository {
  createDraft(input: CheckoutSessionDraft): Promise<{ checkoutId: string }>;
}

export interface CheckoutService {
  /** Completes checkout by delegating to orders + payments modules. */
  completeCheckout(checkoutId: string): Promise<{ orderId: string }>;
}
