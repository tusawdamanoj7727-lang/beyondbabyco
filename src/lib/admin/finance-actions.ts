"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Json } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";
import {
  expenseInputSchema,
  financeExportSchema,
  gstExportSchema,
  journalInputSchema,
  reconcileInputSchema,
  vendorInputSchema,
  vendorPaymentInputSchema,
} from "./finance-schema";

export interface FinanceActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  content?: string;
  fileName?: string;
}

async function guardManage() {
  await requirePermission(PERMISSIONS.FINANCE_MANAGE);
}

async function guardExport() {
  await requirePermission(PERMISSIONS.FINANCE_EXPORT);
}

function revalidate() {
  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/expenses");
  revalidatePath("/admin/finance/vendors");
  revalidatePath("/admin/finance/ledger");
  revalidatePath("/admin/finance/gst");
  revalidatePath("/admin/finance/reconciliation");
}

async function audit(table: string, record: string, action: string, payload?: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit", {
    p_table: table,
    p_record: record,
    p_action: action,
    p_new: (payload ?? {}) as Json,
  });
}

// --------------------------- Expenses ---------------------------

export async function createExpense(input: Parameters<typeof expenseInputSchema.parse>[0]): Promise<FinanceActionResult> {
  await guardManage();
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid expense." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      category: parsed.data.category,
      vendor_id: parsed.data.vendor_id,
      amount: parsed.data.amount,
      gst_amount: parsed.data.gst_amount,
      currency: parsed.data.currency,
      invoice_number: parsed.data.invoice_number,
      invoice_date: parsed.data.invoice_date,
      payment_status: parsed.data.payment_status,
      notes: parsed.data.notes,
      note: parsed.data.notes,
      spent_at: parsed.data.spent_at ?? new Date().toISOString(),
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await supabase.from("ledger_entries").insert({
    ledger_type: "purchase",
    reference: parsed.data.invoice_number ?? `EXP-${data.id.slice(0, 8)}`,
    narration: parsed.data.notes ?? "Expense recorded",
    debit: parsed.data.amount,
    credit: 0,
    expense_id: data.id,
    vendor_id: parsed.data.vendor_id,
    entry_date: (parsed.data.spent_at ?? new Date().toISOString()).slice(0, 10),
    created_by: user.user?.id ?? null,
  });

  if (parsed.data.vendor_id) {
    await supabase.rpc("log_audit", { p_table: "finance_vendors", p_record: parsed.data.vendor_id, p_action: "expense_linked" });
  }

  await audit("expenses", data.id, "create");
  revalidate();
  return { ok: true, error: null, id: data.id };
}

export async function updateExpense(id: string, input: Parameters<typeof expenseInputSchema.parse>[0]): Promise<FinanceActionResult> {
  await guardManage();
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid expense." };

  const supabase = await createSupabaseServerClient();
  const patch: Database["public"]["Tables"]["expenses"]["Update"] = {
    category: parsed.data.category,
    vendor_id: parsed.data.vendor_id,
    amount: parsed.data.amount,
    gst_amount: parsed.data.gst_amount,
    currency: parsed.data.currency,
    invoice_number: parsed.data.invoice_number,
    invoice_date: parsed.data.invoice_date,
    payment_status: parsed.data.payment_status,
    notes: parsed.data.notes,
    note: parsed.data.notes,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.spent_at) patch.spent_at = parsed.data.spent_at;

  const { error } = await supabase.from("expenses").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("expenses", id, "update");
  revalidate();
  return { ok: true, error: null, id };
}

export async function deleteExpense(id: string): Promise<FinanceActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expenses").update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("expenses", id, "delete");
  revalidate();
  return { ok: true, error: null, id };
}

// --------------------------- Vendors ---------------------------

export async function createFinanceVendor(input: Parameters<typeof vendorInputSchema.parse>[0]): Promise<FinanceActionResult> {
  await guardManage();
  const parsed = vendorInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid vendor." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("finance_vendors")
    .insert({
      name: parsed.data.name,
      gst_number: parsed.data.gst_number,
      pan: parsed.data.pan,
      bank_details: parsed.data.bank_details as Json,
      contact_person: parsed.data.contact_person,
      email: parsed.data.email,
      phone: parsed.data.phone,
      payment_terms: parsed.data.payment_terms,
      is_active: parsed.data.is_active,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await audit("finance_vendors", data.id, "create");
  revalidate();
  return { ok: true, error: null, id: data.id };
}

export async function updateFinanceVendor(id: string, input: Parameters<typeof vendorInputSchema.parse>[0]): Promise<FinanceActionResult> {
  await guardManage();
  const parsed = vendorInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid vendor." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("finance_vendors")
    .update({
      name: parsed.data.name,
      gst_number: parsed.data.gst_number,
      pan: parsed.data.pan,
      bank_details: parsed.data.bank_details as Json,
      contact_person: parsed.data.contact_person,
      email: parsed.data.email,
      phone: parsed.data.phone,
      payment_terms: parsed.data.payment_terms,
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("finance_vendors", id, "update");
  revalidate();
  return { ok: true, error: null, id };
}

export async function deleteFinanceVendor(id: string): Promise<FinanceActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("finance_vendors").update({ deleted_at: new Date().toISOString(), is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("finance_vendors", id, "delete");
  revalidate();
  return { ok: true, error: null, id };
}

// --------------------------- Journal entries ---------------------------

export async function createJournalEntry(input: Parameters<typeof journalInputSchema.parse>[0]): Promise<FinanceActionResult> {
  await guardManage();
  const parsed = journalInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid journal entry." };

  const totalDebit = parsed.data.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = parsed.data.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return { ok: false, error: "Debit and credit totals must match." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: journal, error } = await supabase
    .from("journal_entries")
    .insert({
      reference: parsed.data.reference,
      narration: parsed.data.narration,
      entry_date: parsed.data.entry_date,
      total_debit: totalDebit,
      total_credit: totalCredit,
      status: "draft",
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await supabase.from("ledger_entries").insert(
    parsed.data.lines.map((l) => ({
      ledger_type: l.ledger_type,
      account_code: l.account_code,
      reference: parsed.data.reference,
      narration: l.narration ?? parsed.data.narration,
      debit: l.debit,
      credit: l.credit,
      journal_entry_id: journal.id,
      entry_date: parsed.data.entry_date,
      created_by: user.user?.id ?? null,
    })),
  );

  await audit("journal_entries", journal.id, "create");
  revalidate();
  return { ok: true, error: null, id: journal.id };
}

export async function approveJournalEntry(id: string): Promise<FinanceActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("journal_entries")
    .update({ status: "approved", approved_by: user.user?.id ?? null, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("journal_entries", id, "approve");
  revalidate();
  return { ok: true, error: null, id };
}

export async function reverseJournalEntry(id: string): Promise<FinanceActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { data: original } = await supabase.from("journal_entries").select("*").eq("id", id).maybeSingle();
  if (!original) return { ok: false, error: "Journal entry not found." };

  const { data: user } = await supabase.auth.getUser();
  const { data: reversal, error } = await supabase
    .from("journal_entries")
    .insert({
      reference: `REV-${original.reference}`,
      narration: `Reversal of ${original.reference}`,
      entry_date: new Date().toISOString().slice(0, 10),
      total_debit: original.total_credit,
      total_credit: original.total_debit,
      status: "approved",
      reversed_by_entry_id: id,
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await supabase.from("journal_entries").update({ status: "reversed", updated_at: new Date().toISOString() }).eq("id", id);
  await audit("journal_entries", id, "reverse", { reversal_id: reversal.id });
  revalidate();
  return { ok: true, error: null, id: reversal.id };
}

// --------------------------- Vendor payments ---------------------------

export async function createVendorPayment(input: Parameters<typeof vendorPaymentInputSchema.parse>[0]): Promise<FinanceActionResult> {
  await guardManage();
  const parsed = vendorPaymentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payment." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("vendor_payments")
    .insert({
      vendor_id: parsed.data.vendor_id,
      expense_id: parsed.data.expense_id,
      amount: parsed.data.amount,
      payment_status: parsed.data.payment_status,
      scheduled_date: parsed.data.scheduled_date,
      reference: parsed.data.reference,
      notes: parsed.data.notes,
      paid_at: parsed.data.payment_status === "paid" ? new Date().toISOString() : null,
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  if (parsed.data.payment_status === "paid") {
    const { data: vendor } = await supabase.from("finance_vendors").select("outstanding_balance").eq("id", parsed.data.vendor_id).maybeSingle();
    if (vendor) {
      await supabase.from("finance_vendors").update({
        outstanding_balance: Math.max(0, Number(vendor.outstanding_balance) - parsed.data.amount),
        updated_at: new Date().toISOString(),
      }).eq("id", parsed.data.vendor_id);
    }
  }

  await audit("vendor_payments", data.id, "create");
  revalidate();
  return { ok: true, error: null, id: data.id };
}

export async function markVendorPaymentPaid(id: string): Promise<FinanceActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { data: p } = await supabase.from("vendor_payments").select("*").eq("id", id).maybeSingle();
  if (!p) return { ok: false, error: "Payment not found." };

  const { error } = await supabase
    .from("vendor_payments")
    .update({ payment_status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  const { data: vendor } = await supabase.from("finance_vendors").select("outstanding_balance").eq("id", p.vendor_id).maybeSingle();
  if (vendor) {
    await supabase.from("finance_vendors").update({
      outstanding_balance: Math.max(0, Number(vendor.outstanding_balance) - Number(p.amount)),
      updated_at: new Date().toISOString(),
    }).eq("id", p.vendor_id);
  }

  await audit("vendor_payments", id, "mark_paid");
  revalidate();
  return { ok: true, error: null, id };
}

// --------------------------- Reconciliation ---------------------------

export async function createBankReconciliation(input: Parameters<typeof reconcileInputSchema.parse>[0]): Promise<FinanceActionResult> {
  await guardManage();
  const parsed = reconcileInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reconciliation." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("bank_reconciliation")
    .insert({
      bank_account_id: parsed.data.bank_account_id,
      statement_date: parsed.data.statement_date,
      opening_balance: parsed.data.opening_balance,
      closing_balance: parsed.data.closing_balance,
      status: "pending",
      notes: parsed.data.notes,
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await audit("bank_reconciliation", data.id, "create");
  revalidate();
  return { ok: true, error: null, id: data.id };
}

export async function importBankStatementPlaceholder(bankAccountId: string): Promise<FinanceActionResult> {
  await guardManage();
  // TODO: Parse CSV/OFX bank statement when integration is connected
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bank_transactions")
    .insert({
      bank_account_id: bankAccountId,
      type: "credit",
      amount: 0,
      reference: "IMPORT-PLACEHOLDER",
      description: "Statement import placeholder — connect bank feed later",
      transaction_date: new Date().toISOString().slice(0, 10),
      matched: false,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await audit("bank_transactions", data.id, "import_placeholder");
  revalidate();
  return { ok: true, error: null, id: data.id, content: "Placeholder import recorded. Connect bank feed to import real statements." };
}

export async function matchBankTransaction(transactionId: string, paymentId?: string, settlementId?: string): Promise<FinanceActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bank_transactions")
    .update({ matched: true, payment_id: paymentId ?? null, settlement_id: settlementId ?? null })
    .eq("id", transactionId);
  if (error) return { ok: false, error: error.message };

  await audit("bank_transactions", transactionId, "match", { payment_id: paymentId, settlement_id: settlementId });
  revalidate();
  return { ok: true, error: null, id: transactionId };
}

export async function manualReconcile(reconciliationId: string): Promise<FinanceActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { data: rec } = await supabase.from("bank_reconciliation").select("*").eq("id", reconciliationId).maybeSingle();
  if (!rec) return { ok: false, error: "Reconciliation not found." };

  const { count } = await supabase
    .from("bank_transactions")
    .select("id", { count: "exact", head: true })
    .eq("reconciliation_id", reconciliationId)
    .eq("matched", true);

  const matchedCount = count ?? 0;
  const { count: unmatched } = await supabase
    .from("bank_transactions")
    .select("id", { count: "exact", head: true })
    .eq("bank_account_id", rec.bank_account_id)
    .eq("matched", false);

  const status = (unmatched ?? 0) === 0 ? "reconciled" : matchedCount > 0 ? "partial" : "pending";

  const { error } = await supabase
    .from("bank_reconciliation")
    .update({
      matched_count: matchedCount,
      unmatched_count: unmatched ?? 0,
      status,
      reconciled_at: status === "reconciled" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reconciliationId);
  if (error) return { ok: false, error: error.message };

  await audit("bank_reconciliation", reconciliationId, "manual_reconcile", { status });
  revalidate();
  return { ok: true, error: null, id: reconciliationId };
}

// --------------------------- GST export ---------------------------

export async function exportGstReport(input: Parameters<typeof gstExportSchema.parse>[0]): Promise<FinanceActionResult> {
  await guardExport();
  const parsed = gstExportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid GST export." };

  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, tax_total, grand_total, created_at")
    .gte("created_at", `${parsed.data.period_start}T00:00:00`)
    .lte("created_at", `${parsed.data.period_end}T23:59:59.999Z`);

  const payload = {
    period_start: parsed.data.period_start,
    period_end: parsed.data.period_end,
    report_type: parsed.data.report_type,
    orders: orders ?? [],
    exported_at: new Date().toISOString(),
  };

  const { data: report } = await supabase
    .from("gst_reports")
    .insert({
      period_start: parsed.data.period_start,
      period_end: parsed.data.period_end,
      report_type: parsed.data.report_type,
      total_taxable: (orders ?? []).reduce((s, o) => s + Number(o.grand_total) - Number(o.tax_total), 0),
      total_gst: (orders ?? []).reduce((s, o) => s + Number(o.tax_total), 0),
      output_tax: (orders ?? []).reduce((s, o) => s + Number(o.tax_total), 0),
      report: payload as Json,
      exported_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  let content = "";
  let fileName = `gst-${parsed.data.period_start}-${parsed.data.period_end}`;
  if (parsed.data.format === "json") {
    content = JSON.stringify(payload, null, 2);
    fileName += ".json";
  } else {
    content = "order_number,tax_total,grand_total,created_at\n" + (orders ?? []).map((o) =>
      `${o.order_number},${o.tax_total},${o.grand_total},${o.created_at}`,
    ).join("\n");
    fileName += ".csv";
  }

  if (report) await audit("gst_reports", report.id, "export", { format: parsed.data.format });
  revalidate();
  return { ok: true, error: null, id: report?.id, content, fileName };
}

// --------------------------- Finance export ---------------------------

export async function exportFinanceReport(input: {
  report_type: string;
  format: "csv" | "excel" | "pdf";
  rows?: Record<string, string | number | null>[];
  columns?: { key: string; header: string }[];
}): Promise<FinanceActionResult> {
  await guardExport();
  const parsed = financeExportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid export." };

  const cols = parsed.data.columns.length ? parsed.data.columns : Object.keys(parsed.data.rows[0] ?? {}).map((k) => ({ key: k, header: k }));
  const rows = parsed.data.rows.length ? parsed.data.rows : [{ message: "No data" }];

  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  let content = "";
  let fileName = `${parsed.data.report_type}-${new Date().toISOString().slice(0, 10)}`;
  if (parsed.data.format === "csv") {
    content = [cols.map((c) => escape(c.header)).join(","), ...rows.map((r) => cols.map((c) => escape(r[c.key] ?? null)).join(","))].join("\n");
    fileName += ".csv";
  } else if (parsed.data.format === "excel") {
    const headerCells = cols.map((c) => `<Cell><Data ss:Type="String">${c.header}</Data></Cell>`).join("");
    const dataRows = rows.map((r) => `<Row>${cols.map((c) => `<Cell><Data ss:Type="String">${r[c.key] ?? ""}</Data></Cell>`).join("")}</Row>`).join("");
    content = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet><Table><Row>${headerCells}</Row>${dataRows}</Table></Worksheet></Workbook>`;
    fileName += ".xls";
  } else {
    content = `<html><body><h1>${parsed.data.report_type}</h1><table border="1"><tr>${cols.map((c) => `<th>${c.header}</th>`).join("")}</tr>${rows.map((r) => `<tr>${cols.map((c) => `<td>${r[c.key] ?? ""}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
    fileName += ".html";
  }

  await audit("transactions", parsed.data.report_type, "export", { format: parsed.data.format });
  return { ok: true, error: null, content, fileName };
}

// --------------------------- Seed default bank account if none ---------------------------

export async function ensureDefaultBankAccount(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("bank_accounts").select("id", { count: "exact", head: true });
  if ((count ?? 0) === 0) {
    await supabase.from("bank_accounts").insert({
      name: "Primary Operating Account",
      bank_name: "Placeholder Bank",
      account_number: "XXXX0000",
      ifsc: "PLACE0001",
      balance: 0,
      is_active: true,
    });
  }
}
