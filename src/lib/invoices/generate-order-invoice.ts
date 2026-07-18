import "server-only";

import {
  buildEnterpriseInvoicePdf,
  type InvoiceDocKind,
} from "./build-enterprise-invoice-pdf";
import { loadOrderInvoiceData, type OrderInvoiceData } from "./load-invoice-data";

export type GeneratedInvoice = {
  bytes: Uint8Array;
  filename: string;
  contentType: "application/pdf";
  data: OrderInvoiceData;
};

/** Generate a production tax invoice (or packing/shipping doc) for an order. */
export async function generateOrderInvoice(
  orderId: string,
  docKind: InvoiceDocKind = "invoice",
): Promise<GeneratedInvoice | null> {
  const data = await loadOrderInvoiceData(orderId);
  if (!data) return null;

  const bytes = await buildEnterpriseInvoicePdf(data, docKind);
  const suffix =
    docKind === "invoice" ? "tax-invoice" : docKind === "packing_slip" ? "packing-slip" : "shipping-label";

  return {
    bytes,
    filename: `${data.orderNumber}-${suffix}.pdf`,
    contentType: "application/pdf",
    data,
  };
}

export async function generateOrderInvoiceAttachment(
  orderId: string,
): Promise<{ filename: string; content: Buffer; contentType: string } | null> {
  const generated = await generateOrderInvoice(orderId, "invoice");
  if (!generated) return null;
  return {
    filename: generated.filename,
    content: Buffer.from(generated.bytes),
    contentType: generated.contentType,
  };
}
