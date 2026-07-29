import { MarketplaceNotImplementedError } from "../../shared/errors";
import type { CheckoutSessionDraft } from "../../shared/types";

/** Placeholder — checkout UI will call existing orders/payments modules. */
export async function createCheckoutSession(
  _input: CheckoutSessionDraft
): Promise<{ checkoutId: string }> {
  throw new MarketplaceNotImplementedError("checkout session creation");
}
