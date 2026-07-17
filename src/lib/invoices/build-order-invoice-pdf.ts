import "server-only";

/** Minimal production PDF invoice builder (no external PDF dependency). */

export type InvoicePdfItem = {
  name: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoicePdfInput = {
  title: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: {
    fullName: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: InvoicePdfItem[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency?: string;
  paymentMethod?: string | null;
  docLabel?: string;
};

function pdfEscape(value: string) {
  return value.replace(/[()\\]/g, " ").slice(0, 110);
}

function formatMoney(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function textLine(fontSize: number, x: number, y: number, text: string) {
  return `BT /F1 ${fontSize} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}

/**
 * Builds a single-page PDF invoice with brand header, order table, and GST-aware totals.
 * Logo/QR require a binary PDF image/xobject pipeline — intentionally text-first and print-ready.
 */
export function buildOrderInvoicePdf(input: InvoicePdfInput): Uint8Array {
  const currency = input.currency ?? "INR";
  const docLabel = input.docLabel ?? "TAX INVOICE";
  const lines: string[] = [];

  lines.push(textLine(18, 50, 780, "BeyondBabyCo"));
  lines.push(textLine(9, 50, 764, "A unit of Tusawda Global Private Limited"));
  lines.push(textLine(9, 50, 750, "Udaipur, Rajasthan, India · care@beyondbabyco.com"));
  lines.push(textLine(14, 400, 780, docLabel));
  lines.push(textLine(11, 400, 760, `Invoice No: ${input.orderNumber}`));
  lines.push(textLine(10, 400, 744, `Date: ${input.orderDate}`));
  if (input.paymentMethod) {
    lines.push(textLine(10, 400, 728, `Payment: ${input.paymentMethod}`));
  }

  lines.push(textLine(11, 50, 720, "Bill To"));
  lines.push(textLine(10, 50, 704, input.customerName));
  if (input.customerEmail) lines.push(textLine(9, 50, 690, input.customerEmail));
  if (input.customerPhone) lines.push(textLine(9, 50, 676, input.customerPhone));

  let y = 650;
  if (input.shippingAddress) {
    const a = input.shippingAddress;
    lines.push(textLine(11, 300, 720, "Ship To"));
    lines.push(textLine(10, 300, 704, a.fullName));
    lines.push(textLine(9, 300, 690, a.line1));
    if (a.line2) {
      lines.push(textLine(9, 300, 676, a.line2));
      y = 650;
    }
    lines.push(textLine(9, 300, a.line2 ? 662 : 676, `${a.city}, ${a.state} ${a.pincode}`));
  }

  lines.push(textLine(10, 50, y, "Item"));
  lines.push(textLine(10, 280, y, "SKU"));
  lines.push(textLine(10, 360, y, "Qty"));
  lines.push(textLine(10, 410, y, "Rate"));
  lines.push(textLine(10, 480, y, "Amount"));
  y -= 14;
  lines.push(textLine(8, 50, y, "--------------------------------------------------------------------------"));
  y -= 16;

  for (const item of input.items.slice(0, 18)) {
    lines.push(textLine(9, 50, y, item.name));
    lines.push(textLine(9, 280, y, item.sku || "—"));
    lines.push(textLine(9, 360, y, String(item.quantity)));
    lines.push(textLine(9, 410, y, formatMoney(item.unitPrice, currency)));
    lines.push(textLine(9, 480, y, formatMoney(item.total, currency)));
    y -= 16;
    if (y < 180) break;
  }

  y = Math.min(y - 10, 220);
  lines.push(textLine(8, 50, y, "--------------------------------------------------------------------------"));
  y -= 18;
  lines.push(textLine(10, 360, y, "Subtotal"));
  lines.push(textLine(10, 460, y, formatMoney(input.subtotal, currency)));
  y -= 16;
  if (input.discountTotal > 0) {
    lines.push(textLine(10, 360, y, "Discount"));
    lines.push(textLine(10, 460, y, `-${formatMoney(input.discountTotal, currency)}`));
    y -= 16;
  }
  lines.push(textLine(10, 360, y, "Shipping"));
  lines.push(textLine(10, 460, y, formatMoney(input.shippingTotal, currency)));
  y -= 16;
  lines.push(textLine(10, 360, y, "GST (incl.)"));
  lines.push(textLine(10, 460, y, formatMoney(input.taxTotal, currency)));
  y -= 18;
  lines.push(textLine(12, 360, y, "Grand Total"));
  lines.push(textLine(12, 460, y, formatMoney(input.grandTotal, currency)));

  lines.push(textLine(8, 50, 70, "Prices are inclusive of applicable GST. This is a computer-generated invoice."));
  lines.push(textLine(8, 50, 56, "BeyondBabyCo · Thank you for your order · Print or save this PDF for your records."));
  lines.push(textLine(8, 50, 42, `Order reference: ${input.orderNumber}`));

  const streamBody = lines.join("\n");
  const streamLength = Buffer.byteLength(streamBody, "utf8");

  const objects = [
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`,
    `4 0 obj << /Length ${streamLength} >> stream\n${streamBody}\nendstream endobj`,
    `5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${obj}\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;

  return new TextEncoder().encode(pdf);
}
