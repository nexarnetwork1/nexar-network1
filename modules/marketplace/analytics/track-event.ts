import { createClient } from "@/lib/supabase/server";
import type { AnalyticsEventInput } from "../statistics/validators";

export async function trackAnalyticsEvent(
  customerId: string | null,
  input: AnalyticsEventInput
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("commerce_analytics_events").insert({
    store_id: input.storeId ?? null,
    customer_id: customerId,
    product_id: input.productId ?? null,
    event_type: input.eventType,
    session_id: input.sessionId ?? null,
    country_code: input.countryCode ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) throw error;
}
