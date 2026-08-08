import { NextResponse } from "next/server";
import { generateInvoicePdfBuffer } from "@/modules/invoices/pdf";
import { getInvoiceById } from "@/modules/invoices/repository";
import { requireInvoiceAccess, AuthorizationError } from "@/lib/auth/guards";
import { apiError, handleApiError } from "@/lib/api/errors";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await requireInvoiceAccess(id);

    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return apiError("Not found", 404, "NOT_FOUND");
    }

    const pdfBuffer = await generateInvoicePdfBuffer(id);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return apiError(err.message, err.message.includes("Not authenticated") ? 401 : 403, "FORBIDDEN");
    }
    return handleApiError(err, "/api/invoices/[id]/pdf");
  }
}
