import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BankAccountRow,
  BankTransactionRow,
  ExpenseListItem,
  ExpensePaymentStatus,
  FinanceDashboard,
  FinancialReportSection,
  FinanceListResult,
  GstReportRow,
  GstSummary,
  JournalEntryRow,
  LedgerEntryRow,
  LedgerType,
  ReconciliationRow,
  VendorDetail,
  VendorListItem,
  VendorPaymentRow,
} from "./finance-types";
import { formatMoney } from "./finance-types";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function endOfMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getFinanceDashboard(): Promise<FinanceDashboard> {
  const supabase = await createSupabaseServerClient();
  const todayStart = startOfToday();
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();

  const [
    { data: orders },
    { data: expenses },
    { data: refunds },
    { data: vendorPayments },
    { data: vendors },
    { data: bankAccounts },
    { data: reconciliations },
    { data: gstReports },
  ] = await Promise.all([
    supabase.from("orders").select("grand_total, tax_total, created_at, status"),
    supabase.from("expenses").select("amount, spent_at").is("deleted_at", null),
    supabase.from("order_refunds").select("amount, created_at"),
    supabase.from("vendor_payments").select("amount, payment_status"),
    supabase.from("finance_vendors").select("outstanding_balance").is("deleted_at", null),
    supabase.from("bank_accounts").select("balance").eq("is_active", true),
    supabase.from("bank_reconciliation").select("status"),
    supabase.from("gst_reports").select("gst_payable, output_tax, total_gst, period_start, period_end").gte("period_end", monthStart).lte("period_start", monthEnd),
  ]);

  const cancelled = new Set(["cancelled", "refunded"]);
  const todayOrders = (orders ?? []).filter((o) => o.created_at >= todayStart && !cancelled.has(o.status));
  const todaysRevenue = todayOrders.reduce((s, o) => s + Number(o.grand_total), 0);

  const todayExpenses = (expenses ?? []).filter((e) => e.spent_at >= todayStart);
  const todaysExpenses = todayExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const refundAmount = (refunds ?? []).filter((r) => r.created_at >= todayStart).reduce((s, r) => s + Number(r.amount), 0);
  const netProfit = todaysRevenue - todaysExpenses - refundAmount;

  const outstandingVendorPayments = (vendorPayments ?? [])
    .filter((p) => p.payment_status === "scheduled" || p.payment_status === "partial")
    .reduce((s, p) => s + Number(p.amount), 0);

  const vendorOutstanding = (vendors ?? []).reduce((s, v) => s + Number(v.outstanding_balance), 0);

  const latestGst = (gstReports ?? [])[0];
  const gstPayable = Number(latestGst?.gst_payable ?? 0);
  const gstCollected = (orders ?? [])
    .filter((o) => !cancelled.has(o.status) && o.created_at >= `${monthStart}T00:00:00`)
    .reduce((s, o) => s + Number(o.tax_total), 0);

  const bankBalance = (bankAccounts ?? []).reduce((s, b) => s + Number(b.balance), 0);
  const pendingReconciliation = (reconciliations ?? []).filter((r) => r.status === "pending" || r.status === "partial").length;

  return {
    todaysRevenue,
    todaysExpenses,
    netProfit,
    outstandingVendorPayments: outstandingVendorPayments + vendorOutstanding,
    gstPayable,
    gstCollected,
    refundAmount,
    bankBalance,
    pendingReconciliation,
  };
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export interface ExpenseListParams {
  search?: string;
  category?: string;
  vendorId?: string;
  paymentStatus?: ExpensePaymentStatus | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export async function listExpenses(params: ExpenseListParams = {}): Promise<FinanceListResult<ExpenseListItem>> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));

  let query = supabase.from("expenses").select("*", { count: "exact" }).is("deleted_at", null);
  if (params.category) query = query.eq("category", params.category);
  if (params.vendorId) query = query.eq("vendor_id", params.vendorId);
  if (params.paymentStatus && params.paymentStatus !== "all") query = query.eq("payment_status", params.paymentStatus);
  if (params.dateFrom) query = query.gte("spent_at", params.dateFrom);
  if (params.dateTo) query = query.lte("spent_at", params.dateTo);
  query = query.order("spent_at", { ascending: false });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  const vendorIds = [...new Set((data ?? []).map((e) => e.vendor_id).filter(Boolean))] as string[];
  const { data: vendorRows } = vendorIds.length
    ? await supabase.from("finance_vendors").select("id, name").in("id", vendorIds)
    : { data: [] };
  const vMap = new Map((vendorRows ?? []).map((v) => [v.id, v.name]));

  let rows: ExpenseListItem[] = (data ?? []).map((e) => ({
    id: e.id,
    category: e.category,
    vendorId: e.vendor_id,
    vendorName: e.vendor_id ? vMap.get(e.vendor_id) ?? null : null,
    amount: Number(e.amount),
    gstAmount: Number(e.gst_amount ?? 0),
    currency: e.currency,
    invoiceNumber: e.invoice_number,
    invoiceDate: e.invoice_date,
    paymentStatus: (e.payment_status ?? "unpaid") as ExpensePaymentStatus,
    notes: e.notes ?? e.note,
    spentAt: e.spent_at,
    createdAt: e.created_at,
  }));

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.invoiceNumber?.toLowerCase().includes(q) ?? false) ||
        (r.vendorName?.toLowerCase().includes(q) ?? false) ||
        (r.notes?.toLowerCase().includes(q) ?? false) ||
        (r.category?.toLowerCase().includes(q) ?? false),
    );
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getExpense(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: e } = await supabase.from("expenses").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!e) return null;
  let vendorName: string | null = null;
  if (e.vendor_id) {
    const { data: v } = await supabase.from("finance_vendors").select("name").eq("id", e.vendor_id).maybeSingle();
    vendorName = v?.name ?? null;
  }
  return {
    id: e.id,
    category: e.category,
    vendorId: e.vendor_id,
    vendorName,
    amount: Number(e.amount),
    gstAmount: Number(e.gst_amount ?? 0),
    currency: e.currency,
    invoiceNumber: e.invoice_number,
    invoiceDate: e.invoice_date,
    paymentStatus: (e.payment_status ?? "unpaid") as ExpensePaymentStatus,
    notes: e.notes ?? e.note,
    attachments: (e.attachments as unknown[]) ?? [],
    spentAt: e.spent_at,
  };
}

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

export async function listFinanceVendors(): Promise<VendorListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("finance_vendors")
    .select("id, name, gst_number, pan, contact_person, email, outstanding_balance, payment_terms, is_active, updated_at")
    .is("deleted_at", null)
    .order("name");
  return (data ?? []).map(mapVendor);
}

export async function getFinanceVendor(id: string): Promise<VendorDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: v } = await supabase.from("finance_vendors").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!v) return null;
  return {
    ...mapVendor(v),
    phone: v.phone,
    bankDetails: (v.bank_details as Record<string, unknown>) ?? {},
    createdAt: v.created_at,
  };
}

function mapVendor(v: {
  id: string;
  name: string;
  gst_number: string | null;
  pan: string | null;
  contact_person: string | null;
  email: string | null;
  outstanding_balance: number;
  payment_terms: string | null;
  is_active: boolean;
  updated_at: string;
}): VendorListItem {
  return {
    id: v.id,
    name: v.name,
    gstNumber: v.gst_number,
    pan: v.pan,
    contactPerson: v.contact_person,
    email: v.email,
    outstandingBalance: Number(v.outstanding_balance),
    paymentTerms: v.payment_terms,
    isActive: v.is_active,
    updatedAt: v.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

export interface LedgerListParams {
  ledgerType?: LedgerType | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export async function listLedgerEntries(params: LedgerListParams = {}): Promise<FinanceListResult<LedgerEntryRow>> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 30));

  let query = supabase.from("ledger_entries").select("*", { count: "exact" });
  if (params.ledgerType && params.ledgerType !== "all") query = query.eq("ledger_type", params.ledgerType);
  if (params.dateFrom) query = query.gte("entry_date", params.dateFrom);
  if (params.dateTo) query = query.lte("entry_date", params.dateTo);
  query = query.order("entry_date", { ascending: false });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  let rows: LedgerEntryRow[] = (data ?? []).map(mapLedger);
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.reference?.toLowerCase().includes(q) ?? false) ||
        (r.narration?.toLowerCase().includes(q) ?? false) ||
        (r.accountCode?.toLowerCase().includes(q) ?? false),
    );
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

function mapLedger(l: {
  id: string;
  ledger_type: string;
  account_code: string | null;
  reference: string | null;
  narration: string | null;
  debit: number;
  credit: number;
  currency: string;
  entry_date: string;
  created_at: string;
}): LedgerEntryRow {
  return {
    id: l.id,
    ledgerType: l.ledger_type as LedgerType,
    accountCode: l.account_code,
    reference: l.reference,
    narration: l.narration,
    debit: Number(l.debit),
    credit: Number(l.credit),
    currency: l.currency,
    entryDate: l.entry_date,
    createdAt: l.created_at,
  };
}

export async function listJournalEntries(limit = 20): Promise<JournalEntryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("journal_entries").select("*").order("entry_date", { ascending: false }).limit(limit);
  return (data ?? []).map((j) => ({
    id: j.id,
    reference: j.reference,
    narration: j.narration,
    status: j.status as JournalEntryRow["status"],
    entryDate: j.entry_date,
    totalDebit: Number(j.total_debit),
    totalCredit: Number(j.total_credit),
    createdAt: j.created_at,
  }));
}

export async function getLedger(): Promise<{ entries: LedgerEntryRow[]; journals: JournalEntryRow[] }> {
  const [entries, journals] = await Promise.all([
    listLedgerEntries({ perPage: 50 }),
    listJournalEntries(20),
  ]);
  return { entries: entries.rows, journals };
}

// ---------------------------------------------------------------------------
// GST
// ---------------------------------------------------------------------------

export async function getGSTSummary(periodStart?: string, periodEnd?: string): Promise<GstSummary> {
  const supabase = await createSupabaseServerClient();
  const start = periodStart ?? startOfMonth();
  const end = periodEnd ?? endOfMonth();

  const [{ data: orders }, { data: expenses }, { data: gstReports }] = await Promise.all([
    supabase.from("orders").select("tax_total, grand_total, created_at, status").gte("created_at", `${start}T00:00:00`).lte("created_at", `${end}T23:59:59.999Z`),
    supabase.from("expenses").select("gst_amount, amount, spent_at").is("deleted_at", null).gte("spent_at", `${start}T00:00:00`).lte("spent_at", `${end}T23:59:59.999Z`),
    supabase.from("gst_reports").select("*").gte("period_start", start).lte("period_end", end).order("created_at", { ascending: false }).limit(1),
  ]);

  const cancelled = new Set(["cancelled", "refunded"]);
  const salesGst = (orders ?? []).filter((o) => !cancelled.has(o.status)).reduce((s, o) => s + Number(o.tax_total), 0);
  const purchaseGst = (expenses ?? []).reduce((s, e) => s + Number(e.gst_amount ?? 0), 0);
  const inputCredit = purchaseGst;
  const outputTax = salesGst;
  const gstPayable = Math.max(0, outputTax - inputCredit);
  const saved = gstReports?.[0];

  return {
    salesGst,
    purchaseGst,
    inputCredit: Number(saved?.input_credit ?? inputCredit),
    outputTax: Number(saved?.output_tax ?? outputTax),
    gstPayable: Number(saved?.gst_payable ?? gstPayable),
    gstCollected: salesGst,
    periodStart: start,
    periodEnd: end,
  };
}

export async function listGstReports(limit = 12): Promise<GstReportRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("gst_reports").select("*").order("period_start", { ascending: false }).limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    reportType: (r.report_type ?? "monthly") as GstReportRow["reportType"],
    totalTaxable: Number(r.total_taxable),
    totalGst: Number(r.total_gst),
    inputCredit: Number(r.input_credit ?? 0),
    outputTax: Number(r.output_tax ?? 0),
    gstPayable: Number(r.gst_payable ?? 0),
    createdAt: r.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Vendor payments
// ---------------------------------------------------------------------------

export async function getVendorPayments(vendorId?: string): Promise<VendorPaymentRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("vendor_payments").select("*").order("created_at", { ascending: false }).limit(50);
  if (vendorId) query = query.eq("vendor_id", vendorId);
  const { data } = await query;

  const vendorIds = [...new Set((data ?? []).map((p) => p.vendor_id))];
  const { data: vendors } = vendorIds.length
    ? await supabase.from("finance_vendors").select("id, name").in("id", vendorIds)
    : { data: [] };
  const vMap = new Map((vendors ?? []).map((v) => [v.id, v.name]));

  return (data ?? []).map((p) => ({
    id: p.id,
    vendorId: p.vendor_id,
    vendorName: vMap.get(p.vendor_id) ?? "—",
    expenseId: p.expense_id,
    amount: Number(p.amount),
    paymentStatus: p.payment_status as VendorPaymentRow["paymentStatus"],
    scheduledDate: p.scheduled_date,
    paidAt: p.paid_at,
    reference: p.reference,
    createdAt: p.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Bank reconciliation
// ---------------------------------------------------------------------------

export async function listBankAccounts(): Promise<BankAccountRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("bank_accounts").select("*").order("name");
  return (data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    bankName: b.bank_name,
    accountNumber: b.account_number,
    balance: Number(b.balance),
    currency: b.currency,
    isActive: b.is_active,
  }));
}

export async function listBankTransactions(accountId?: string): Promise<BankTransactionRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("bank_transactions").select("*").order("transaction_date", { ascending: false }).limit(100);
  if (accountId) query = query.eq("bank_account_id", accountId);
  const { data } = await query;
  return (data ?? []).map((t) => ({
    id: t.id,
    bankAccountId: t.bank_account_id,
    type: t.type as "credit" | "debit",
    amount: Number(t.amount),
    reference: t.reference,
    description: t.description,
    transactionDate: t.transaction_date,
    matched: t.matched,
  }));
}

export async function listReconciliations(): Promise<ReconciliationRow[]> {
  const supabase = await createSupabaseServerClient();
  const [{ data }, { data: accounts }] = await Promise.all([
    supabase.from("bank_reconciliation").select("*").order("statement_date", { ascending: false }).limit(30),
    supabase.from("bank_accounts").select("id, name"),
  ]);
  const aMap = new Map((accounts ?? []).map((a) => [a.id, a.name]));
  return (data ?? []).map((r) => ({
    id: r.id,
    bankAccountName: aMap.get(r.bank_account_id) ?? "—",
    statementDate: r.statement_date,
    openingBalance: Number(r.opening_balance),
    closingBalance: Number(r.closing_balance),
    matchedCount: r.matched_count,
    unmatchedCount: r.unmatched_count,
    status: r.status as ReconciliationRow["status"],
    reconciledAt: r.reconciled_at,
  }));
}

export async function getReconciliationData() {
  const [accounts, transactions, reconciliations, unmatchedPayments] = await Promise.all([
    listBankAccounts(),
    listBankTransactions(),
    listReconciliations(),
    getUnmatchedBankItems(),
  ]);
  return { accounts, transactions, reconciliations, unmatchedPayments };
}

async function getUnmatchedBankItems() {
  const supabase = await createSupabaseServerClient();
  const [{ data: bankTx }, { data: payments }, { data: settlements }] = await Promise.all([
    supabase.from("bank_transactions").select("id, amount, reference, description, matched").eq("matched", false).limit(20),
    supabase.from("payments").select("id, amount, gateway_txn_id, status").in("status", ["paid", "captured"]).limit(20),
    supabase.from("settlements").select("id, received_amount, settlement_date, bank_reference").limit(20),
  ]);
  return {
    bankTransactions: bankTx ?? [],
    payments: payments ?? [],
    settlements: settlements ?? [],
  };
}

// ---------------------------------------------------------------------------
// Financial reports
// ---------------------------------------------------------------------------

export async function getFinancialReports(): Promise<FinancialReportSection[]> {
  const dashboard = await getFinanceDashboard();
  const gst = await getGSTSummary();
  const vendors = await listFinanceVendors();
  const vendorOutstanding = vendors.reduce((s, v) => s + v.outstandingBalance, 0);

  const supabase = await createSupabaseServerClient();
  const monthStart = startOfMonth();
  const { data: expenses } = await supabase.from("expenses").select("category, amount").is("deleted_at", null).gte("spent_at", `${monthStart}T00:00:00`);
  const expenseByCategory = new Map<string, number>();
  for (const e of expenses ?? []) {
    const cat = e.category ?? "misc";
    expenseByCategory.set(cat, (expenseByCategory.get(cat) ?? 0) + Number(e.amount));
  }
  const topExpense = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1])[0];

  return [
    {
      id: "pnl",
      title: "Profit & Loss",
      metrics: [
        { label: "Revenue (today)", value: formatMoney(dashboard.todaysRevenue) },
        { label: "Expenses (today)", value: formatMoney(dashboard.todaysExpenses) },
        { label: "Net Profit", value: formatMoney(dashboard.netProfit) },
      ],
    },
    {
      id: "balance",
      title: "Balance Sheet (basic)",
      metrics: [
        { label: "Bank Balance", value: formatMoney(dashboard.bankBalance) },
        { label: "Vendor Outstanding", value: formatMoney(vendorOutstanding) },
        { label: "GST Payable", value: formatMoney(dashboard.gstPayable) },
      ],
    },
    {
      id: "cashflow",
      title: "Cash Flow Summary",
      metrics: [
        { label: "Inflow (today)", value: formatMoney(dashboard.todaysRevenue) },
        { label: "Outflow (today)", value: formatMoney(dashboard.todaysExpenses + dashboard.refundAmount) },
        { label: "Net Cash", value: formatMoney(dashboard.todaysRevenue - dashboard.todaysExpenses - dashboard.refundAmount) },
      ],
    },
    {
      id: "expense_analysis",
      title: "Expense Analysis",
      metrics: [
        { label: "Top Category", value: topExpense?.[0] ?? "—" },
        { label: "Top Category Amount", value: formatMoney(topExpense?.[1] ?? 0) },
        { label: "Total Expenses (MTD)", value: formatMoney((expenses ?? []).reduce((s, e) => s + Number(e.amount), 0)) },
      ],
    },
    {
      id: "gst_summary",
      title: "GST Summary",
      metrics: [
        { label: "Output Tax", value: formatMoney(gst.outputTax) },
        { label: "Input Credit", value: formatMoney(gst.inputCredit) },
        { label: "GST Payable", value: formatMoney(gst.gstPayable) },
      ],
    },
    {
      id: "vendor_outstanding",
      title: "Vendor Outstanding",
      metrics: [
        { label: "Total Outstanding", value: formatMoney(vendorOutstanding) },
        { label: "Scheduled Payments", value: formatMoney(dashboard.outstandingVendorPayments) },
        { label: "Active Vendors", value: String(vendors.filter((v) => v.isActive).length) },
      ],
    },
    {
      id: "refund_analysis",
      title: "Refund Analysis",
      metrics: [
        { label: "Refunds (today)", value: formatMoney(dashboard.refundAmount) },
        { label: "Impact on Profit", value: formatMoney(-dashboard.refundAmount) },
      ],
    },
  ];
}

export async function getExpenseFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const { data: vendors } = await supabase.from("finance_vendors").select("id, name").is("deleted_at", null).order("name");
  return { vendors: vendors ?? [] };
}
