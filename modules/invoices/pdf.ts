import PDFDocument from "pdfkit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvoiceById } from "./repository";
import { getOrderItems } from "@/modules/orders/repository";

export async function generateInvoicePdfBuffer(
  invoiceId: string
): Promise<Buffer> {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice not found");

  const items = await getOrderItems(invoice.order_id);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Nexar Network", { align: "left" });
    doc.fontSize(10).fillColor("#666").text("Invoice", { align: "left" });
    doc.moveDown();

    doc.fillColor("#000");
    doc.fontSize(12).text(`Invoice: ${invoice.invoice_number}`);
    doc.text(`Status: ${invoice.status.toUpperCase()}`);
    doc.text(`Issued: ${new Date(invoice.issued_at).toLocaleString()}`);
    doc.text(`Due: ${new Date(invoice.due_at).toLocaleString()}`);
    doc.moveDown();

    doc.text(`Store: ${invoice.store.name}`);
    doc.text(`Customer: ${invoice.customer.full_name ?? invoice.customer.email}`);
    doc.text(`Email: ${invoice.customer.email}`);
    doc.moveDown();

    doc.fontSize(11).text("Items", { underline: true });
    doc.moveDown(0.5);

    for (const item of items) {
      doc.fontSize(10).text(
        `${item.product_name}  ×${item.quantity}  —  ${invoice.currency} ${Number(item.line_total).toFixed(2)}`
      );
    }

    doc.moveDown();
    doc.fontSize(12).text(
      `Total: ${invoice.currency} ${Number(invoice.amount).toFixed(2)}`,
      { align: "right" }
    );

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#999").text(
      "Support: admin@nexarnetwork.org | www.nexarnetwork.org",
      { align: "center" }
    );

    doc.end();
  });
}

export async function generateAndStoreInvoicePdf(
  invoiceId: string,
  customerId: string
): Promise<string> {
  const pdfBuffer = await generateInvoicePdfBuffer(invoiceId);
  const path = `${customerId}/${invoiceId}.pdf`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from("invoices")
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ pdf_path: path })
    .eq("id", invoiceId);

  if (updateError) throw updateError;

  return path;
}
