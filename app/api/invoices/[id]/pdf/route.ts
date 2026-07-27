import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdfBuffer } from "@/modules/invoices/pdf";
import { getInvoiceById } from "@/modules/invoices/repository";
import { apiError, handleApiError } from "@/lib/api/errors";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return apiError("Not found", 404, "NOT_FOUND");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isCustomer = invoice.customer_id === user.id;
    const isAdmin = profile?.role === "admin";

    let isMerchant = false;
    if (profile?.role === "merchant") {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("id", invoice.store_id)
        .eq("owner_id", user.id)
        .single();
      isMerchant = !!store;
    }

    if (!isCustomer && !isMerchant && !isAdmin) {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const pdfBuffer = await generateInvoicePdfBuffer(id);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (err) {
    return handleApiError(err, "/api/invoices/[id]/pdf");
  }
}
