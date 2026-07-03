"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import { JournalStatusBadge } from "@/components/admin/finance/FinanceStatusBadge";
import FormField, { Input, Select, fieldControlClasses } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import Card from "@/components/ui/Card";
import {
  LEDGER_TYPES,
  LEDGER_TYPE_LABELS,
  formatMoney,
  type JournalEntryRow,
  type LedgerEntryRow,
  type LedgerType,
} from "@/lib/admin/finance-types";
import { approveJournalEntry, createJournalEntry, exportFinanceReport, reverseJournalEntry } from "@/lib/admin/finance-actions";

export default function LedgerClient(props: {
  entries: LedgerEntryRow[];
  journals: JournalEntryRow[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  ledgerType: LedgerType | "all";
  search: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [ref, setRef] = useState("");
  const [narration, setNarration] = useState("");
  const [debit, setDebit] = useState("");
  const [credit, setCredit] = useState("");
  const [ledgerType, setLedgerTypeForm] = useState<LedgerType>("general");

  function push(patch: Record<string, string | null>) {
    const sp = new URLSearchParams();
    const base = { ledgerType: props.ledgerType, search: props.search, page: String(props.page) };
    const merged = { ...base, ...patch };
    if (!("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/finance/ledger?${sp.toString()}`);
  }

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  const columns: Column<LedgerEntryRow>[] = [
    { key: "type", header: "Ledger", render: (r) => LEDGER_TYPE_LABELS[r.ledgerType] },
    { key: "date", header: "Date", render: (r) => r.entryDate },
    { key: "ref", header: "Reference", render: (r) => r.reference ?? "—" },
    { key: "narration", header: "Narration", render: (r) => r.narration ?? "—" },
    { key: "debit", header: "Debit", render: (r) => r.debit > 0 ? formatMoney(r.debit, r.currency) : "—" },
    { key: "credit", header: "Credit", render: (r) => r.credit > 0 ? formatMoney(r.credit, r.currency) : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-green-900">Ledger</h2>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(async () => {
          const res = await exportFinanceReport({
            report_type: "ledger",
            format: "csv",
            rows: props.entries.map((r) => ({ type: r.ledgerType, date: r.entryDate, ref: r.reference, debit: r.debit, credit: r.credit })),
            columns: [{ key: "type", header: "Type" }, { key: "date", header: "Date" }, { key: "ref", header: "Reference" }, { key: "debit", header: "Debit" }, { key: "credit", header: "Credit" }],
          });
          if (res.content && res.fileName) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([res.content], { type: "text/csv" })); a.download = res.fileName; a.click(); }
          return { ok: res.ok, error: res.error };
        })}>Export</Button>
      </div>

      <div className="flex flex-wrap gap-3" role="search" aria-label="Ledger filters">
        <Select aria-label="Ledger type" value={props.ledgerType} onChange={(e) => push({ ledgerType: e.target.value })} className="w-44">
          <option value="all">All ledgers</option>
          {LEDGER_TYPES.map((t) => <option key={t} value={t}>{LEDGER_TYPE_LABELS[t]}</option>)}
        </Select>
        <input type="search" defaultValue={props.search} onChange={(e) => push({ search: e.target.value || null })} placeholder="Search reference…" aria-label="Search ledger" className={fieldControlClasses + " flex-1 min-w-[180px]"} />
      </div>

      <Card padding="md" radius="3xl" variant="outline">
        <h3 className="font-heading text-sm font-bold text-green-900">Create journal entry</h3>
        <form className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          const d = Number(debit);
          const c = Number(credit);
          run(() => createJournalEntry({
            reference: ref,
            narration,
            entry_date: new Date().toISOString().slice(0, 10),
            lines: [
              { ledger_type: ledgerType, debit: d, credit: 0 },
              { ledger_type: "general", debit: 0, credit: c },
            ],
          }));
        }}>
          <FormField label="Reference"><Input required value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Reference" /></FormField>
          <FormField label="Narration"><Input value={narration} onChange={(e) => setNarration(e.target.value)} aria-label="Narration" /></FormField>
          <FormField label="Debit account"><Select value={ledgerType} onChange={(e) => setLedgerTypeForm(e.target.value as LedgerType)} aria-label="Debit ledger">{LEDGER_TYPES.map((t) => <option key={t} value={t}>{LEDGER_TYPE_LABELS[t]}</option>)}</Select></FormField>
          <FormField label="Debit"><Input type="number" min="0" step="0.01" required value={debit} onChange={(e) => setDebit(e.target.value)} aria-label="Debit amount" /></FormField>
          <FormField label="Credit"><Input type="number" min="0" step="0.01" required value={credit} onChange={(e) => setCredit(e.target.value)} aria-label="Credit amount" /></FormField>
          <div className="flex items-end"><Button type="submit" size="sm" disabled={pending}>Create</Button></div>
        </form>
      </Card>

      <DataTable columns={columns} rows={props.entries} getRowId={(r) => r.id} empty="No ledger entries." />
      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) })} />

      <section aria-labelledby="journals-heading">
        <h3 id="journals-heading" className="font-heading text-sm font-bold text-green-900">Journal entries</h3>
        {props.journals.length === 0 ? <p className="mt-2 text-sm text-green-700/60">No journal entries.</p> : (
          <ul className="mt-2 space-y-2 text-sm">
            {props.journals.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cream-100 p-3">
                <span>{j.reference} · {formatMoney(j.totalDebit)} / {formatMoney(j.totalCredit)}</span>
                <div className="flex items-center gap-2">
                  <JournalStatusBadge status={j.status} />
                  {j.status === "draft" && <button type="button" disabled={pending} onClick={() => run(() => approveJournalEntry(j.id))} className="text-xs text-green-700 hover:underline">Approve</button>}
                  {j.status === "approved" && <button type="button" disabled={pending} onClick={() => run(() => reverseJournalEntry(j.id))} className="text-xs text-green-700 hover:underline">Reverse</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
