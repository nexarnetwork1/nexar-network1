"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { createNotification } from "@/modules/notifications/repository";
import { buildInvoicePayUrl } from "@/lib/qr/payload";
import { sendInvoiceReadyEmail } from "@/lib/email/send";
import type { ActionResult } from "@/modules/auth/actions";

const paymentRequestSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(2, "Description required").max(500),
  customerEmail: z.string().email("Valid customer email required"),
});

export type PaymentRequestResult = ActionResult & {
  invoiceId?: string;
  invoiceNumber?: string;
  payUrl?: string;
};

export async function createPaymentRequestAction(
  formData: FormData
): Promise<PaymentRequestResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  if (store.status !== "active") {
    return { success: false, error: "Store must be active to create payment requests" };
  }

  const parsed = paymentRequestSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
    customerEmail: formData.get("customerEmail"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_merchant_payment_request", {
    p_store_id: store.id,
    p_amount: parsed.data.amount,
    p_description: parsed.data.description,
    p_customer_email: parsed.data.customerEmail,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as {
    invoice_id: string;
    invoice_number: string;
    share_token: string;
  };

  const payUrl = buildInvoicePayUrl(result.share_token);

  const { data: customer } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.customerEmail)
    .maybeSingle();

  if (customer?.id) {
    await createNotification({
      userId: customer.id,
      type: "payment",
      title: "Payment request",
      body: `${store.name} sent you invoice ${result.invoice_number} for $${parsed.data.amount.toFixed(2)}.`,
      metadata: { invoice_id: result.invoice_id, store_id: store.id },
    }).catch(() => undefined);

    await sendInvoiceReadyEmail({
      to: parsed.data.customerEmail,
      customerName: parsed.data.customerEmail.split("@")[0],
      invoiceNumber: result.invoice_number,
      amount: parsed.data.amount,
      currency: "USD",
      storeName: store.name,
    }).catch(() => undefined);
  }

  revalidatePath("/merchant/invoices");
  return {
    success: true,
    invoiceId: result.invoice_id,
    invoiceNumber: result.invoice_number,
    payUrl,
  };
}
