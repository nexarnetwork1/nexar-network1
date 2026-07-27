"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/users/repository";
import { getOrCreateCart, getCartWithItems } from "@/modules/cart/repository";
import { generateAndStoreInvoicePdf } from "@/modules/invoices/pdf";
import type { ActionResult } from "@/modules/auth/actions";

type CheckoutResult = ActionResult & {
  orderIds?: string[];
};

export async function checkoutAction(): Promise<CheckoutResult> {
  const profile = await requireRole(["customer"]);
  const cart = await getOrCreateCart(profile.id);

  if (!cart) {
    return { success: false, error: "Cart not found" };
  }

  const { items } = await getCartWithItems(profile.id);

  if (items.length === 0) {
    return { success: false, error: "Cart is empty" };
  }

  const storeIds = [...new Set(items.map((i) => i.product.store_id))];
  const supabase = await createClient();
  const orderIds: string[] = [];

  for (const storeId of storeIds) {
    const { data, error } = await supabase.rpc("create_store_checkout", {
      p_store_id: storeId,
      p_cart_id: cart.id,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as {
      order_id: string;
      invoice_id: string;
      invoice_number: string;
    };

    orderIds.push(result.order_id);

    try {
      await generateAndStoreInvoicePdf(result.invoice_id, profile.id);
    } catch {
      // PDF generation failure should not block checkout
    }
  }

  revalidatePath("/customer/cart");
  revalidatePath("/customer/orders");
  revalidatePath("/customer/invoices");

  if (orderIds.length === 1) {
    redirect(`/customer/orders/${orderIds[0]}`);
  }

  redirect("/customer/orders");
}
