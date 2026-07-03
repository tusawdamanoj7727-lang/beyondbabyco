/**
 * Client-safe types and constants for Accounting & Finance.
 */

export const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "salaries",
  "marketing",
  "shipping",
  "inventory",
  "software",
  "professional",
  "travel",
  "misc",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: "Rent",
  utilities: "Utilities",
  salaries: "Salaries",
  marketing: "Marketing",
  shipping: "Shipping",
  inventory: "Inventory",
  software: "Software",
  professional: "Professional Services",
  travel: "Travel",
  misc: "Miscellaneous",
};

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "scheduled"] as const;
export type ExpensePaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<ExpensePaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
  scheduled: "Scheduled",
};

export const LEDGER_TYPES = ["general", "sales", "purchase", "gst", "customer", "vendor"] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const LEDGER_TYPE_LABELS: Record<LedgerType, string> = {
  general: "General Ledger",
  sales: "Sales Ledger",
  purchase: "Purchase Ledger",
  gst: "GST Ledger",
  customer: "Customer Ledger",
  vendor: "Vendor Ledger",
};

export const JOURNAL_STATUSES = ["draft", "pending", "approved", "reversed"] as const;
export type JournalStatus = (typeof JOURNAL_STATUSES)[number];

export const JOURNAL_STATUS_LABELS: Record<JournalStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  reversed: "Reversed",
};

export const VENDOR_PAYMENT_STATUSES = ["scheduled", "paid", "partial", "cancelled"] as const;
export type VendorPaymentStatus = (typeof VENDOR_PAYMENT_STATUSES)[number];

export const RECONCILIATION_STATUSES = ["pending", "partial", "reconciled"] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

export const GST_REPORT_TYPES = ["monthly", "quarterly", "yearly", "summary"] as const;
export type GstReportType = (typeof GST_REPORT_TYPES)[number];

export const FINANCE_NAV = [
  { href: "/admin/finance", label: "Dashboard" },
  { href: "/admin/finance/expenses", label: "Expenses" },
  { href: "/admin/finance/vendors", label: "Vendors" },
  { href: "/admin/finance/ledger", label: "Ledger" },
  { href: "/admin/finance/gst", label: "GST" },
  { href: "/admin/finance/reconciliation", label: "Reconciliation" },
] as const;

export interface FinanceDashboard {
  todaysRevenue: number;
  todaysExpenses: number;
  netProfit: number;
  outstandingVendorPayments: number;
  gstPayable: number;
  gstCollected: number;
  refundAmount: number;
  bankBalance: number;
  pendingReconciliation: number;
}

export interface ExpenseListItem {
  id: string;
  category: string | null;
  vendorId: string | null;
  vendorName: string | null;
  amount: number;
  gstAmount: number;
  currency: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  paymentStatus: ExpensePaymentStatus;
  notes: string | null;
  spentAt: string;
  createdAt: string;
}

export interface VendorListItem {
  id: string;
  name: string;
  gstNumber: string | null;
  pan: string | null;
  contactPerson: string | null;
  email: string | null;
  outstandingBalance: number;
  paymentTerms: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface VendorDetail extends VendorListItem {
  phone: string | null;
  bankDetails: Record<string, unknown>;
  createdAt: string;
}

export interface LedgerEntryRow {
  id: string;
  ledgerType: LedgerType;
  accountCode: string | null;
  reference: string | null;
  narration: string | null;
  debit: number;
  credit: number;
  currency: string;
  entryDate: string;
  createdAt: string;
}

export interface JournalEntryRow {
  id: string;
  reference: string;
  narration: string | null;
  status: JournalStatus;
  entryDate: string;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

export interface GstSummary {
  salesGst: number;
  purchaseGst: number;
  inputCredit: number;
  outputTax: number;
  gstPayable: number;
  gstCollected: number;
  periodStart: string;
  periodEnd: string;
}

export interface GstReportRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  reportType: GstReportType;
  totalTaxable: number;
  totalGst: number;
  inputCredit: number;
  outputTax: number;
  gstPayable: number;
  createdAt: string;
}

export interface VendorPaymentRow {
  id: string;
  vendorId: string;
  vendorName: string;
  expenseId: string | null;
  amount: number;
  paymentStatus: VendorPaymentStatus;
  scheduledDate: string | null;
  paidAt: string | null;
  reference: string | null;
  createdAt: string;
}

export interface BankAccountRow {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface BankTransactionRow {
  id: string;
  bankAccountId: string;
  type: "credit" | "debit";
  amount: number;
  reference: string | null;
  description: string | null;
  transactionDate: string;
  matched: boolean;
}

export interface ReconciliationRow {
  id: string;
  bankAccountName: string;
  statementDate: string;
  openingBalance: number;
  closingBalance: number;
  matchedCount: number;
  unmatchedCount: number;
  status: ReconciliationStatus;
  reconciledAt: string | null;
}

export interface FinancialReportSection {
  id: string;
  title: string;
  metrics: { label: string; value: string }[];
}

export interface FinanceListResult<T> {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// TODO: Tally export integration
// TODO: Zoho Books sync
// TODO: QuickBooks sync
// TODO: Xero sync
