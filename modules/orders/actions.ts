"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/users/repository";
import {
  getOrCreateMarketplaceCart,
  getMarketplaceCartWithItems,
} from "@/modules/marketplace/cart/server";
import { getCatalogProductById } from "@/modules/marketplace/catalog";
import { generateAndStoreInvoicePdf } from "@/modules/invoices/pdf";
import { createNotification } from "@/modules/notifications/repository";
import { getStoreById } from "@/modules/stores/repository";
import { getOrderById } from "@/modules/orders/repository";
import { auditLogger } from "@/lib/logging/audit-logger";
import { sendInvoiceReadyEmail } from "@/lib/email/send";
import type { ActionResult } from "@/modules/auth/actions";

type CheckoutResult = ActionResult & {
  orderIds?: string[];
};

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_pending_order", {
    p_order_id: orderId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  auditLogger.log({
    action: "order.cancelled",
    entityType: "order",
    entityId: orderId,
    actorId: profile.id,
    actorRole: profile.role,
  });

  revalidatePath("/customer/orders");
  revalidatePath(`/customer/orders/${orderId}`);
  revalidatePath("/customer/invoices");

  return { success: true };
}

export async function merchantCancelOrderAction(orderId: string): Promise<ActionResult> {
  const profile = await requireRole(["merchant"]);
  const supabase = await createClient();

  const { error } = await supabase.rpc("merchant_cancel_pending_order", {
    p_order_id: orderId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  auditLogger.log({
    action: "order.cancelled",
    entityType: "order",
    entityId: orderId,
    actorId: profile.id,
    actorRole: profile.role,
  });

  revalidatePath("/merchant/orders");
  revalidatePath(`/merchant/orders/${orderId}`);
  revalidatePath("/merchant/invoices");

  return { success: true };
}

export async function checkoutAction(): Promise<CheckoutResult> {
  const profile = await requireRole(["customer"]);
  const cart = await getOrCreateMarketplaceCart(profile.id);

  if (!cart) {
    return { success: false, error: "Cart not found" };
  }

  const { items } = await getMarketplaceCartWithItems(profile.id);

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

    auditLogger.log({
      action: "order.checkout",
      entityType: "order",
      entityId: result.order_id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: {
        store_id: storeId,
        invoice_id: result.invoice_id,
        invoice_number: result.invoice_number,
      },
    });

    try {
      await generateAndStoreInvoicePdf(result.invoice_id, profile.id);
    } catch {
      // PDF generation failure should not block checkout
    }

    await createNotification({
      userId: profile.id,
      type: "order",
      title: "Order placed",
      body: `Invoice ${result.invoice_number} is ready for payment.`,
      metadata: { order_id: result.order_id, invoice_id: result.invoice_id },
    }).catch(() => undefined);

    const store = await getStoreById(storeId);
    if (store) {
      await createNotification({
        userId: store.owner_id,
        type: "order",
        title: "New order received",
        body: `Invoice ${result.invoice_number} awaiting customer payment.`,
        metadata: { order_id: result.order_id, store_id: storeId },
      }).catch(() => undefined);
    }

    const { data: invoiceRow } = await supabase
      .from("invoices")
      .select("amount, currency")
      .eq("id", result.invoice_id)
      .single();

    if (profile.email && invoiceRow) {
      await sendInvoiceReadyEmail({
        to: profile.email,
        customerName: profile.full_name ?? "Customer",
        invoiceNumber: result.invoice_number,
        amount: Number(invoiceRow.amount),
        currency: invoiceRow.currency,
        storeName: store?.name ?? "Merchant",
      }).catch(() => undefined);
    }
  }

  revalidatePath("/marketplace/cart");
  revalidatePath("/customer/orders");
  revalidatePath("/customer/invoices");
  revalidatePath("/merchant/orders");
  revalidatePath("/admin/orders");

  if (orderIds.length === 1) {
    redirect(`/customer/orders/${orderIds[0]}?confirmed=1`);
  }

  redirect("/customer/orders");
}

export async function updateOrderFulfillmentAction(
  orderId: string,
  fulfillmentStatus: "processing" | "shipped" | "delivered"
): Promise<ActionResult> {
  const profile = await requireRole(["merchant", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_order_fulfillment", {
    p_order_id: orderId,
    p_fulfillment_status: fulfillmentStatus,
  });

  if (error) return { success: false, error: error.message };

  const order = await getOrderById(orderId);
  if (order?.customer_id) {
    const eventMap = {
      processing: "order_processing",
      shipped: "order_shipped",
      delivered: "order_delivered",
    } as const;
    const { dispatchNotification } = await import("@/modules/notifications/dispatch");
    await dispatchNotification({
      event: eventMap[fulfillmentStatus],
      userId: order.customer_id,
      type: "order",
      title:
        fulfillmentStatus === "shipped"
          ? "Order shipped"
          : fulfillmentStatus === "delivered"
            ? "Order delivered"
            : "Order processing",
      body: `Your order from ${order.store.name} is now ${fulfillmentStatus}.`,
      metadata: { order_id: orderId, event: eventMap[fulfillmentStatus] },
    });
  }

  revalidatePath("/merchant/orders");
  revalidatePath(`/merchant/orders/${orderId}`);
  revalidatePath("/customer/orders");
  revalidatePath(`/customer/orders/${orderId}`);

  return { success: true };
}

export async function buyNowAction(
  productId: string,
  quantity: number
): Promise<CheckoutResult> {
  const profile = await requireRole(["customer"]);
  const product = await getCatalogProductById(productId);

  if (!product) {
    return { success: false, error: "Product not available" };
  }

  if (product.stock < quantity) {
    return { success: false, error: "Insufficient stock" };
  }

  const cart = await getOrCreateMarketplaceCart(profile.id);
  if (!cart) {
    return { success: false, error: "Could not create cart" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      product_id: productId,
      quantity,
    });
    if (error) return { success: false, error: error.message };
  }

  return checkoutAction();
}
