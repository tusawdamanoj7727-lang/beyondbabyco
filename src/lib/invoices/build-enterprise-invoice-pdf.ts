import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";

import { BRAND_EMAIL_LOGO } from "@/lib/brand/logo";
import { sellerGstinDisplay } from "./seller";
import type { InvoiceLineItem, OrderInvoiceData } from "./load-invoice-data";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;
const GREEN = rgb(0.114, 0.271, 0.176);
const TERRA = rgb(0.804, 0.416, 0.271);
const MUTED = rgb(0.35, 0.45, 0.38);
const LINE = rgb(0.83, 0.9, 0.85);
const ROW_ALT = rgb(0.97, 0.99, 0.97);
const BLACK = rgb(0.08, 0.12, 0.1);

export type InvoiceDocKind = "invoice" | "packing_slip" | "shipping_label";

/**
 * Format money for pdf-lib StandardFonts (WinAnsi).
 * Do NOT use Intl currency style — "₹" (U+20B9) throws WinAnsi encode errors and 500s the API.
 */
function money(n: number, _currency = "INR"): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `Rs. ${formatted}`;
}

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

async function loadLogoBytes(): Promise<Uint8Array | null> {
  try {
    const filePath = path.join(process.cwd(), "public", BRAND_EMAIL_LOGO.replace(/^\//, ""));
    return new Uint8Array(await readFile(filePath));
  } catch {
    return null;
  }
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 32 || buf.byteLength > 2_000_000) return null;
    return buf;
  } catch {
    return null;
  }
}

async function embedRaster(
  doc: PDFDocument,
  bytes: Uint8Array,
): Promise<PDFImage | null> {
  try {
    return await doc.embedPng(bytes);
  } catch {
    try {
      return await doc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = BLACK,
) {
  page.drawText(text, { x, y, size, font, color });
}

function drawRight(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color = BLACK,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - w, y, size, font, color });
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

type PreparedItem = InvoiceLineItem & { image: PDFImage | null };

/**
 * Enterprise branded tax invoice (Amazon/Flipkart-style), multipage.
 */
export async function buildEnterpriseInvoicePdf(
  data: OrderInvoiceData,
  docKind: InvoiceDocKind = "invoice",
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = await loadLogoBytes();
  const logo = logoBytes ? await embedRaster(doc, logoBytes) : null;

  const qrPng = await QRCode.toBuffer(data.verifyUrl, {
    type: "png",
    width: 160,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  const qrImage = await doc.embedPng(qrPng);

  const prepared: PreparedItem[] = [];
  for (const item of data.items) {
    let image: PDFImage | null = null;
    if (item.imageUrl && docKind === "invoice") {
      const bytes = await fetchImageBytes(item.imageUrl);
      if (bytes) image = await embedRaster(doc, bytes);
    }
    prepared.push({ ...item, image });
  }

  const title =
    docKind === "invoice"
      ? "TAX INVOICE"
      : docKind === "packing_slip"
        ? "PACKING SLIP"
        : "SHIPPING LABEL";

  const contentBottom = 88;
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = drawHeader(page, data, title, logo, qrImage, font, fontBold, docKind);

  if (docKind === "shipping_label") {
    drawShippingLabelBody(page, data, font, fontBold, y);
    drawFooter(page, data, font, 1, 1);
    return doc.save();
  }

  y = drawParties(page, data, font, fontBold, y);
  y -= 8;
  y = drawTableHeader(page, fontBold, y, docKind);

  const rowHeight = docKind === "invoice" ? 42 : 22;

  for (let i = 0; i < prepared.length; i++) {
    if (y - rowHeight < contentBottom + (i === prepared.length - 1 ? 160 : 20)) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = drawHeader(page, data, title, logo, qrImage, font, fontBold, docKind);
      y = drawContinuedBanner(page, font, y);
      y = drawTableHeader(page, fontBold, y, docKind);
    }
    y = drawItemRow(page, prepared[i]!, font, fontBold, y, rowHeight, i, data.currency, docKind);
  }

  if (y < contentBottom + 170) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = drawHeader(page, data, title, logo, qrImage, font, fontBold, docKind);
    y = drawContinuedBanner(page, font, y);
  }

  if (docKind === "invoice") {
    y = drawTotals(page, data, font, fontBold, y);
    y = drawPaymentBlock(page, data, font, fontBold, y);
  } else {
    y = drawPackingSummary(page, data, font, fontBold, y);
  }

  const totalPages = doc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    drawFooter(doc.getPage(i), data, font, i + 1, totalPages);
  }

  return doc.save();
}

function drawHeader(
  page: PDFPage,
  data: OrderInvoiceData,
  title: string,
  logo: PDFImage | null,
  qr: PDFImage,
  font: PDFFont,
  fontBold: PDFFont,
  docKind: InvoiceDocKind,
): number {
  const seller = data.seller;
  let y = PAGE_H - MARGIN;

  if (logo) {
    const maxH = 52;
    const scale = maxH / logo.height;
    const w = logo.width * scale;
    page.drawImage(logo, {
      x: MARGIN,
      y: y - maxH,
      width: w,
      height: maxH,
    });
  } else {
    drawText(page, seller.brandName, MARGIN, y - 18, fontBold, 16, GREEN);
  }

  drawRight(page, title, PAGE_W - MARGIN - 78, y - 14, fontBold, 14, TERRA);
  page.drawImage(qr, {
    x: PAGE_W - MARGIN - 64,
    y: y - 68,
    width: 64,
    height: 64,
  });
  drawRight(page, "Scan to verify", PAGE_W - MARGIN - 78, y - 74, font, 7, MUTED);

  y -= 78;
  drawText(page, seller.brandName, MARGIN, y, fontBold, 11, GREEN);
  y -= 12;
  drawText(page, `A unit of ${seller.legalName}`, MARGIN, y, font, 8, MUTED);
  y -= 11;
  for (const line of wrapLines(seller.registeredAddress, font, 8, 280)) {
    drawText(page, line, MARGIN, y, font, 8, MUTED);
    y -= 10;
  }
  drawText(page, `GSTIN: ${sellerGstinDisplay(seller)}`, MARGIN, y, fontBold, 8, BLACK);
  y -= 10;
  drawText(
    page,
    `Support: ${seller.supportEmail}  ·  ${seller.website}`,
    MARGIN,
    y,
    font,
    8,
    MUTED,
  );
  y -= 14;

  page.drawRectangle({
    x: MARGIN,
    y: y - 46,
    width: PAGE_W - MARGIN * 2,
    height: 50,
    color: ROW_ALT,
    borderColor: LINE,
    borderWidth: 0.5,
  });

  const metaY = y - 14;
  drawText(page, `Invoice No: ${data.invoiceNumber}`, MARGIN + 8, metaY, fontBold, 9);
  drawText(page, `Order No: ${data.orderNumber}`, MARGIN + 220, metaY, fontBold, 9);
  drawText(page, `Invoice Date: ${data.invoiceDate}`, MARGIN + 8, metaY - 14, font, 8, MUTED);
  drawText(page, `Order Date: ${data.orderDate}`, MARGIN + 220, metaY - 14, font, 8, MUTED);
  if (docKind === "invoice" && data.buyerGstin) {
    drawText(page, `Buyer GSTIN: ${data.buyerGstin}`, MARGIN + 8, metaY - 28, font, 8, MUTED);
  }

  return y - 60;
}

function drawParties(
  page: PDFPage,
  data: OrderInvoiceData,
  font: PDFFont,
  fontBold: PDFFont,
  y: number,
): number {
  const colW = (PAGE_W - MARGIN * 2 - 12) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colW + 12;
  const boxH = 78;

  page.drawRectangle({
    x: leftX,
    y: y - boxH,
    width: colW,
    height: boxH,
    borderColor: LINE,
    borderWidth: 0.6,
  });
  page.drawRectangle({
    x: rightX,
    y: y - boxH,
    width: colW,
    height: boxH,
    borderColor: LINE,
    borderWidth: 0.6,
  });

  drawText(page, "Bill To", leftX + 8, y - 14, fontBold, 9, GREEN);
  drawText(page, "Ship To", rightX + 8, y - 14, fontBold, 9, GREEN);

  drawAddressBlock(page, data.billing, data, font, leftX + 8, y - 28, colW - 16);
  drawAddressBlock(page, data.shipping, data, font, rightX + 8, y - 28, colW - 16);

  return y - boxH - 10;
}

function drawAddressBlock(
  page: PDFPage,
  addr: OrderInvoiceData["billing"],
  data: OrderInvoiceData,
  font: PDFFont,
  x: number,
  y: number,
  maxW: number,
) {
  const name = addr?.fullName || data.customerName;
  drawText(page, clip(name, 42), x, y, font, 8);
  y -= 11;
  if (data.customerEmail) {
    drawText(page, clip(data.customerEmail, 40), x, y, font, 7, MUTED);
    y -= 10;
  }
  if (addr) {
    const lines = [
      addr.line1,
      addr.line2,
      `${addr.city}, ${addr.state} ${addr.pincode}`,
      addr.phone ? `Ph: ${addr.phone}` : null,
    ].filter(Boolean) as string[];
    for (const line of lines) {
      for (const w of wrapLines(line, font, 7, maxW).slice(0, 2)) {
        drawText(page, w, x, y, font, 7, MUTED);
        y -= 9;
      }
    }
  }
}

function drawContinuedBanner(page: PDFPage, font: PDFFont, y: number): number {
  drawText(page, "Continued…", MARGIN, y, font, 8, MUTED);
  return y - 14;
}

function drawTableHeader(
  page: PDFPage,
  fontBold: PDFFont,
  y: number,
  docKind: InvoiceDocKind,
): number {
  const h = 18;
  page.drawRectangle({
    x: MARGIN,
    y: y - h,
    width: PAGE_W - MARGIN * 2,
    height: h,
    color: GREEN,
  });
  const ty = y - 12;
  const white = rgb(1, 1, 1);
  if (docKind === "invoice") {
    drawText(page, "Item", MARGIN + 40, ty, fontBold, 7, white);
    drawText(page, "SKU", MARGIN + 168, ty, fontBold, 7, white);
    drawText(page, "HSN", MARGIN + 228, ty, fontBold, 7, white);
    drawText(page, "Qty", MARGIN + 268, ty, fontBold, 7, white);
    drawText(page, "MRP", MARGIN + 292, ty, fontBold, 7, white);
    drawText(page, "Disc.", MARGIN + 338, ty, fontBold, 7, white);
    drawText(page, "GST%", MARGIN + 378, ty, fontBold, 7, white);
    drawText(page, "GST Amt", MARGIN + 414, ty, fontBold, 7, white);
    drawRight(page, "Amount", PAGE_W - MARGIN - 6, ty, fontBold, 7, white);
  } else {
    drawText(page, "Item", MARGIN + 8, ty, fontBold, 8, white);
    drawText(page, "SKU", MARGIN + 280, ty, fontBold, 8, white);
    drawText(page, "Qty", MARGIN + 400, ty, fontBold, 8, white);
    drawRight(page, "Amount", PAGE_W - MARGIN - 6, ty, fontBold, 8, white);
  }
  return y - h - 2;
}

function drawItemRow(
  page: PDFPage,
  item: PreparedItem,
  font: PDFFont,
  fontBold: PDFFont,
  y: number,
  rowH: number,
  index: number,
  currency: string,
  docKind: InvoiceDocKind,
): number {
  if (index % 2 === 1) {
    page.drawRectangle({
      x: MARGIN,
      y: y - rowH,
      width: PAGE_W - MARGIN * 2,
      height: rowH,
      color: ROW_ALT,
    });
  }

  const mid = y - rowH / 2 - 3;

  if (docKind === "invoice") {
    if (item.image) {
      const size = 28;
      page.drawImage(item.image, {
        x: MARGIN + 4,
        y: y - rowH + 6,
        width: size,
        height: size,
      });
    }
    drawText(page, clip(item.name, 28), MARGIN + 40, mid + 6, fontBold, 7);
    drawText(page, clip(item.sku || "—", 12), MARGIN + 168, mid, font, 7, MUTED);
    drawText(page, item.hsn, MARGIN + 228, mid, font, 7);
    drawText(page, String(item.quantity), MARGIN + 272, mid, font, 7);
    drawText(page, money(item.mrp, currency), MARGIN + 292, mid, font, 6.5);
    drawText(page, money(item.discount, currency), MARGIN + 338, mid, font, 6.5);
    drawText(page, `${item.gstRate}%`, MARGIN + 382, mid, font, 7);
    drawText(page, money(item.gstAmount, currency), MARGIN + 414, mid, font, 6.5);
    drawRight(page, money(item.lineTotal, currency), PAGE_W - MARGIN - 6, mid, fontBold, 7);
  } else {
    drawText(page, clip(item.name, 48), MARGIN + 8, mid, font, 8);
    drawText(page, clip(item.sku || "—", 16), MARGIN + 280, mid, font, 8, MUTED);
    drawText(page, String(item.quantity), MARGIN + 404, mid, font, 8);
    drawRight(page, money(item.lineTotal, currency), PAGE_W - MARGIN - 6, mid, fontBold, 8);
  }

  page.drawLine({
    start: { x: MARGIN, y: y - rowH },
    end: { x: PAGE_W - MARGIN, y: y - rowH },
    thickness: 0.4,
    color: LINE,
  });

  return y - rowH;
}

function drawTotals(
  page: PDFPage,
  data: OrderInvoiceData,
  font: PDFFont,
  fontBold: PDFFont,
  y: number,
): number {
  y -= 8;
  const boxX = PAGE_W - MARGIN - 220;
  const rows: Array<{ label: string; value: string; bold?: boolean; color?: ReturnType<typeof rgb> }> = [
    { label: "Subtotal", value: money(data.subtotal, data.currency) },
    { label: "Shipping", value: money(data.shippingTotal, data.currency) },
  ];
  if (data.discountTotal > 0) {
    rows.push({
      label: data.couponCode ? `Coupon (${data.couponCode})` : "Discount",
      value: `-${money(data.discountTotal, data.currency)}`,
    });
  }
  if (data.cgst > 0) rows.push({ label: "CGST", value: money(data.cgst, data.currency) });
  if (data.sgst > 0) rows.push({ label: "SGST", value: money(data.sgst, data.currency) });
  if (data.igst > 0) rows.push({ label: "IGST", value: money(data.igst, data.currency) });
  rows.push({
    label: "Grand Total",
    value: money(data.grandTotal, data.currency),
    bold: true,
    color: GREEN,
  });

  for (const row of rows) {
    const f = row.bold ? fontBold : font;
    drawText(page, row.label, boxX, y, f, row.bold ? 10 : 8, row.color ?? MUTED);
    drawRight(page, row.value, PAGE_W - MARGIN, y, f, row.bold ? 10 : 8, row.color ?? BLACK);
    y -= row.bold ? 16 : 13;
  }
  return y - 6;
}

function drawPaymentBlock(
  page: PDFPage,
  data: OrderInvoiceData,
  font: PDFFont,
  fontBold: PDFFont,
  y: number,
): number {
  y -= 4;
  drawText(page, "Payment details", MARGIN, y, fontBold, 9, GREEN);
  y -= 12;
  drawText(
    page,
    `Method: ${data.paymentMethod || "—"}`,
    MARGIN,
    y,
    font,
    8,
  );
  y -= 11;
  drawText(
    page,
    `Transaction ID: ${data.transactionId || "—"}`,
    MARGIN,
    y,
    font,
    8,
  );
  y -= 14;
  drawText(
    page,
    "This is a computer-generated tax invoice and does not require a physical signature.",
    MARGIN,
    y,
    font,
    7,
    MUTED,
  );
  return y - 10;
}

function drawPackingSummary(
  page: PDFPage,
  data: OrderInvoiceData,
  font: PDFFont,
  fontBold: PDFFont,
  y: number,
): number {
  y -= 10;
  drawText(page, `Items: ${data.items.length}`, MARGIN, y, font, 9);
  drawText(
    page,
    `Total qty: ${data.items.reduce((s, i) => s + i.quantity, 0)}`,
    MARGIN + 120,
    y,
    font,
    9,
  );
  drawRight(
    page,
    `Order total: ${money(data.grandTotal, data.currency)}`,
    PAGE_W - MARGIN,
    y,
    fontBold,
    10,
    GREEN,
  );
  return y - 12;
}

function drawShippingLabelBody(
  page: PDFPage,
  data: OrderInvoiceData,
  font: PDFFont,
  fontBold: PDFFont,
  y: number,
) {
  drawText(page, "Deliver to", MARGIN, y, fontBold, 12, GREEN);
  y -= 18;
  const addr = data.shipping;
  if (addr) {
    drawText(page, addr.fullName, MARGIN, y, fontBold, 14);
    y -= 16;
    drawText(page, addr.line1, MARGIN, y, font, 11);
    y -= 14;
    if (addr.line2) {
      drawText(page, addr.line2, MARGIN, y, font, 11);
      y -= 14;
    }
    drawText(page, `${addr.city}, ${addr.state} ${addr.pincode}`, MARGIN, y, font, 11);
    y -= 14;
    if (addr.phone) drawText(page, `Phone: ${addr.phone}`, MARGIN, y, font, 11);
  }
  y -= 28;
  drawText(page, `Order: ${data.orderNumber}`, MARGIN, y, fontBold, 11);
  y -= 16;
  drawText(page, `From: ${data.seller.brandName}`, MARGIN, y, font, 10, MUTED);
}

function drawFooter(
  page: PDFPage,
  data: OrderInvoiceData,
  font: PDFFont,
  pageNo: number,
  totalPages: number,
) {
  const y = 28;
  page.drawLine({
    start: { x: MARGIN, y: 72 },
    end: { x: PAGE_W - MARGIN, y: 72 },
    thickness: 0.5,
    color: LINE,
  });
  drawText(page, data.seller.returnPolicy, MARGIN, 58, font, 6.5, MUTED);
  drawText(
    page,
    `Support: ${data.seller.supportEmail} · ${data.seller.website}`,
    MARGIN,
    46,
    font,
    6.5,
    MUTED,
  );
  drawText(
    page,
    "Thank you for shopping with BeyondBabyCo — every baby deserves the safest touch.",
    MARGIN,
    34,
    font,
    6.5,
    GREEN,
  );
  const pageLabel =
    totalPages > 0 ? `Page ${pageNo} of ${totalPages}` : `Page ${pageNo}`;
  drawRight(page, pageLabel, PAGE_W - MARGIN, y, font, 7, MUTED);
}
