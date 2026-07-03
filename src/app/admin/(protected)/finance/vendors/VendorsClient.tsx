"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import DeleteDialog from "@/components/admin/DeleteDialog";
import FormField, { Input, Select, Checkbox } from "@/components/admin/FormField";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import { formatMoney, type VendorListItem, type VendorPaymentRow } from "@/lib/admin/finance-types";
import { VendorPaymentBadge } from "@/components/admin/finance/FinanceStatusBadge";
import {
  createFinanceVendor,
  createVendorPayment,
  deleteFinanceVendor,
  markVendorPaymentPaid,
  updateFinanceVendor,
} from "@/lib/admin/finance-actions";

export default function VendorsClient({
  vendors,
  payments,
}: {
  vendors: VendorListItem[];
  payments: VendorPaymentRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<VendorListItem | null>(null);
  const [editing, setEditing] = useState<VendorListItem | null>(null);
  const [payVendorId, setPayVendorId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [form, setForm] = useState({ name: "", gst_number: "", pan: "", contact_person: "", email: "", phone: "", payment_terms: "", bank_account: "", bank_ifsc: "", is_active: true });

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      setEditing(null);
      router.refresh();
    });
  }

  function vendorPayload() {
    return {
      name: form.name,
      gst_number: form.gst_number || null,
      pan: form.pan || null,
      contact_person: form.contact_person || null,
      email: form.email || null,
      phone: form.phone || null,
      payment_terms: form.payment_terms || null,
      bank_details: { account: form.bank_account, ifsc: form.bank_ifsc },
      is_active: form.is_active,
    };
  }

  const columns: Column<VendorListItem>[] = [
    { key: "name", header: "Vendor", render: (v) => <span className="font-semibold text-green-900">{v.name}</span> },
    { key: "gst", header: "GST", render: (v) => v.gstNumber ?? "—" },
    { key: "pan", header: "PAN", render: (v) => v.pan ?? "—" },
    { key: "contact", header: "Contact", render: (v) => v.contactPerson ?? v.email ?? "—" },
    { key: "outstanding", header: "Outstanding", render: (v) => formatMoney(v.outstandingBalance) },
    { key: "terms", header: "Terms", render: (v) => v.paymentTerms ?? "—" },
    { key: "status", header: "Status", render: (v) => <Badge variant={v.isActive ? "success" : "default"} size="sm">{v.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions",
      header: "",
      render: (v) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => { setEditing(v); setForm({ name: v.name, gst_number: v.gstNumber ?? "", pan: v.pan ?? "", contact_person: v.contactPerson ?? "", email: v.email ?? "", phone: "", payment_terms: v.paymentTerms ?? "", bank_account: "", bank_ifsc: "", is_active: v.isActive }); }} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Edit</button>
          <button type="button" onClick={() => setDeleteTarget(v)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold text-green-900">Vendors</h2>

      <form className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (editing) run(() => updateFinanceVendor(editing.id, vendorPayload())); else run(() => createFinanceVendor(vendorPayload())); }}>
        <h3 className="font-heading text-sm font-bold text-green-900">{editing ? "Edit vendor" : "Add vendor"}</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="Vendor name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Vendor name" /></FormField>
          <FormField label="GST number"><Input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} aria-label="GST number" /></FormField>
          <FormField label="PAN"><Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} aria-label="PAN" /></FormField>
          <FormField label="Contact person"><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} aria-label="Contact person" /></FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" /></FormField>
          <FormField label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Phone" /></FormField>
          <FormField label="Bank account"><Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} aria-label="Bank account" /></FormField>
          <FormField label="IFSC"><Input value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })} aria-label="IFSC" /></FormField>
          <FormField label="Payment terms"><Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} aria-label="Payment terms" placeholder="Net 30" /></FormField>
          <Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} label="Active" />
        </div>
        <div className="flex gap-2"><Button type="submit" disabled={pending}>{editing ? "Save" : "Create"}</Button>{editing && <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>}</div>
      </form>

      <DataTable columns={columns} rows={vendors} getRowId={(v) => v.id} empty="No vendors." />

      <section className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4" aria-labelledby="vendor-payments-heading">
        <h3 id="vendor-payments-heading" className="font-heading text-sm font-bold text-green-900">Vendor Payments</h3>
        <form className="flex flex-wrap gap-3 items-end" onSubmit={(e) => { e.preventDefault(); run(() => createVendorPayment({ vendor_id: payVendorId, amount: Number(payAmount), payment_status: "scheduled" })); setPayAmount(""); }}>
          <FormField label="Vendor"><Select required value={payVendorId} onChange={(e) => setPayVendorId(e.target.value)} aria-label="Vendor for payment" className="min-w-[160px]"><option value="">Select</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></FormField>
          <FormField label="Amount"><Input type="number" min="0.01" step="0.01" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} aria-label="Payment amount" className="w-32" /></FormField>
          <Button type="submit" size="sm" disabled={pending}>Schedule</Button>
        </form>
        {payments.length === 0 ? <p className="text-sm text-green-700/60">No vendor payments.</p> : (
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cream-100 p-3">
                <span>{p.vendorName} · {formatMoney(p.amount)}</span>
                <div className="flex items-center gap-2">
                  <VendorPaymentBadge status={p.paymentStatus} />
                  {p.paymentStatus === "scheduled" && (
                    <button type="button" disabled={pending} onClick={() => run(() => markVendorPaymentPaid(p.id))} className="text-xs text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded px-1">Mark paid</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} itemName={deleteTarget?.name} loading={pending} onConfirm={() => { if (deleteTarget) run(() => deleteFinanceVendor(deleteTarget.id)); setDeleteTarget(null); }} />
    </div>
  );
}
