/**
 * @deprecated Use generateOrderInvoice from generate-order-invoice.ts.
 * Kept as a thin re-export so legacy imports keep typechecking during migration.
 */
export {
  buildEnterpriseInvoicePdf as buildOrderInvoicePdf,
} from "./build-enterprise-invoice-pdf";

export type { OrderInvoiceData as InvoicePdfInput } from "./load-invoice-data";
