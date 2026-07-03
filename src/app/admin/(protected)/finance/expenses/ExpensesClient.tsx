"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import DeleteDialog from "@/components/admin/DeleteDialog";
import { ExpensePaymentBadge } from "@/components/admin/finance/FinanceStatusBadge";
import FormField, { Input, Select, Textarea, fieldControlClasses } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  formatDate,
  formatMoney,
  type ExpenseListItem,
  type ExpensePaymentStatus,
} from "@/lib/admin/finance-types";
import { createExpense, deleteExpense, exportFinanceReport, updateExpense } from "@/lib/admin/finance-actions";

export default function ExpensesClient(props: {
  rows: ExpenseListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  vendors: { id: string; name: string }[];
  filters: { search: string; category: string; vendorId: string; paymentStatus: ExpensePaymentStatus | "all" };
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ExpenseListItem | null>(null);
  const [form, setForm] = useState({
    category: "misc" as string,
    vendor_id: "",
    amount: "",
    gst_amount: "0",
    invoice_number: "",
    invoice_date: "",
    payment_status: "unpaid" as ExpensePaymentStatus,
    notes: "",
  });

  function push(patch: Record<string, string | null>) {
    const sp = new URLSearchParams();
    const base = { ...props.filters, page: String(props.page) };
    const merged = { ...base, ...patch };
    if (!("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/finance/expenses?${sp.toString()}`);
  }

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      setEditing(null);
      router.refresh();
    });
  }

  function resetForm() {
    setForm({ category: "misc", vendor_id: "", amount: "", gst_amount: "0", invoice_number: "", invoice_date: "", payment_status: "unpaid", notes: "" });
    setEditing(null);
  }

  const columns: Column<ExpenseListItem>[] = [
    { key: "category", header: "Category", render: (r) => EXPENSE_CATEGORY_LABELS[r.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? r.category ?? "—" },
    { key: "vendor", header: "Vendor", render: (r) => r.vendorName ?? "—" },
    { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount, r.currency) },
    { key: "gst", header: "GST", render: (r) => formatMoney(r.gstAmount, r.currency) },
    { key: "invoice", header: "Invoice", render: (r) => r.invoiceNumber ?? "—" },
    { key: "date", header: "Invoice Date", render: (r) => formatDate(r.invoiceDate) },
    { key: "status", header: "Payment", render: (r) => <ExpensePaymentBadge status={r.paymentStatus} /> },
    { key: "spent", header: "Spent", render: (r) => formatDate(r.spentAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => { setEditing(r); setForm({ category: r.category ?? "misc", vendor_id: r.vendorId ?? "", amount: String(r.amount), gst_amount: String(r.gstAmount), invoice_number: r.invoiceNumber ?? "", invoice_date: r.invoiceDate ?? "", payment_status: r.paymentStatus, notes: r.notes ?? "" }); }} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Edit</button>
          <button type="button" onClick={() => setDeleteId(r.id)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-green-900">Expenses</h2>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(async () => {
          const res = await exportFinanceReport({
            report_type: "expenses",
            format: "csv",
            rows: props.rows.map((r) => ({ category: r.category, vendor: r.vendorName, amount: r.amount, gst: r.gstAmount, status: r.paymentStatus })),
            columns: [{ key: "category", header: "Category" }, { key: "vendor", header: "Vendor" }, { key: "amount", header: "Amount" }, { key: "gst", header: "GST" }, { key: "status", header: "Status" }],
          });
          if (res.content && res.fileName) download(res.content, res.fileName, "text/csv");
          return { ok: res.ok, error: res.error };
        })}>Export CSV</Button>
      </div>

      <div className="flex flex-wrap gap-3" role="search" aria-label="Expense filters">
        <input type="search" defaultValue={props.filters.search} onChange={(e) => push({ search: e.target.value || null })} placeholder="Search…" aria-label="Search expenses" className={fieldControlClasses + " min-w-[180px] flex-1"} />
        <Select aria-label="Category" value={props.filters.category || "all"} onChange={(e) => push({ category: e.target.value === "all" ? null : e.target.value })} className="w-40">
          <option value="all">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>)}
        </Select>
        <Select aria-label="Vendor" value={props.filters.vendorId || "all"} onChange={(e) => push({ vendorId: e.target.value === "all" ? null : e.target.value })} className="w-44">
          <option value="all">All vendors</option>
          {props.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>
        <Select aria-label="Payment status" value={props.filters.paymentStatus} onChange={(e) => push({ paymentStatus: e.target.value })} className="w-36">
          <option value="all">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="scheduled">Scheduled</option>
        </Select>
      </div>

      <form className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4" onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          category: form.category as typeof EXPENSE_CATEGORIES[number],
          vendor_id: form.vendor_id || null,
          amount: Number(form.amount),
          gst_amount: Number(form.gst_amount),
          invoice_number: form.invoice_number || null,
          invoice_date: form.invoice_date || null,
          payment_status: form.payment_status,
          notes: form.notes || null,
        };
        if (editing) run(() => updateExpense(editing.id, payload));
        else run(() => createExpense(payload));
      }}>
        <h3 className="font-heading text-sm font-bold text-green-900">{editing ? "Edit expense" : "Add expense"}</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="Category"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} aria-label="Category">{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>)}</Select></FormField>
          <FormField label="Vendor"><Select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} aria-label="Vendor"><option value="">None</option>{props.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></FormField>
          <FormField label="Amount"><Input type="number" step="0.01" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} aria-label="Amount" /></FormField>
          <FormField label="GST"><Input type="number" step="0.01" min="0" value={form.gst_amount} onChange={(e) => setForm({ ...form, gst_amount: e.target.value })} aria-label="GST amount" /></FormField>
          <FormField label="Invoice #"><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} aria-label="Invoice number" /></FormField>
          <FormField label="Invoice date"><Input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} aria-label="Invoice date" /></FormField>
          <FormField label="Payment status"><Select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as ExpensePaymentStatus })} aria-label="Payment status"><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="scheduled">Scheduled</option></Select></FormField>
          <FormField label="Notes" className="md:col-span-2 lg:col-span-3"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} aria-label="Notes" /></FormField>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{editing ? "Save" : "Create"}</Button>
          {editing && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}
        </div>
      </form>

      <DataTable columns={columns} rows={props.rows} getRowId={(r) => r.id} empty="No expenses recorded." />
      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) })} />

      <DeleteDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} loading={pending} onConfirm={() => { if (deleteId) run(() => deleteExpense(deleteId)); setDeleteId(null); }} />
    </div>
  );
}

function download(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
