"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import Card from "@/components/ui/Card";
import FormField, { Input, Select } from "@/components/admin/FormField";
import { ReconciliationStatusBadge } from "@/components/admin/finance/FinanceStatusBadge";
import { formatMoney, type BankAccountRow, type BankTransactionRow, type ReconciliationRow } from "@/lib/admin/finance-types";
import {
  createBankReconciliation,
  importBankStatementPlaceholder,
  manualReconcile,
  matchBankTransaction,
} from "@/lib/admin/finance-actions";
import { cn } from "@/lib/utils";

export default function ReconciliationClient(props: {
  accounts: BankAccountRow[];
  transactions: BankTransactionRow[];
  reconciliations: ReconciliationRow[];
  unmatched: {
    bankTransactions: { id: string; amount: number; reference: string | null; description: string | null; matched: boolean }[];
    payments: { id: string; amount: number; gateway_txn_id: string | null; status: string }[];
    settlements: { id: string; received_amount: number; settlement_date: string; bank_reference: string | null }[];
  };
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [accountId, setAccountId] = useState(props.accounts[0]?.id ?? "");
  const [selectedBankTxnId, setSelectedBankTxnId] = useState<string | null>(null);
  const [stmtDate, setStmtDate] = useState(new Date().toISOString().slice(0, 10));
  const [opening, setOpening] = useState("0");
  const [closing, setClosing] = useState("0");

  function run(action: () => Promise<{ ok: boolean; error: string | null; content?: string }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold text-green-900">Bank Reconciliation</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {props.accounts.map((a) => (
          <Card key={a.id} padding="md" radius="3xl" variant="outline">
            <p className="text-xs text-green-700/60">{a.bankName}</p>
            <p className="font-semibold text-green-900">{a.name}</p>
            <p className="font-heading text-lg font-bold text-green-900">{formatMoney(a.balance, a.currency)}</p>
          </Card>
        ))}
      </div>

      <Card padding="md" radius="3xl" variant="outline">
        <h3 className="font-heading text-sm font-bold text-green-900">Import bank statement</h3>
        <p className="mt-1 text-sm text-green-700/70">Connect a bank feed or import CSV to match transactions automatically.</p>
        <div className="mt-3 flex flex-wrap gap-3 items-end">
          <FormField label="Bank account">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Bank account">
              {props.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </FormField>
          <Button size="sm" disabled={pending || !accountId} onClick={() => run(() => importBankStatementPlaceholder(accountId))}>Import sample data</Button>
        </div>
      </Card>

      <Card padding="md" radius="3xl" variant="outline">
        <h3 className="font-heading text-sm font-bold text-green-900">New reconciliation</h3>
        <form className="mt-3 flex flex-wrap gap-3 items-end" onSubmit={(e) => {
          e.preventDefault();
          run(() => createBankReconciliation({ bank_account_id: accountId, statement_date: stmtDate, opening_balance: Number(opening), closing_balance: Number(closing) }));
        }}>
          <FormField label="Account"><Select required value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Account">{props.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></FormField>
          <FormField label="Statement date"><Input type="date" required value={stmtDate} onChange={(e) => setStmtDate(e.target.value)} aria-label="Statement date" /></FormField>
          <FormField label="Opening"><Input type="number" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} aria-label="Opening balance" /></FormField>
          <FormField label="Closing"><Input type="number" step="0.01" value={closing} onChange={(e) => setClosing(e.target.value)} aria-label="Closing balance" /></FormField>
          <Button type="submit" size="sm" disabled={pending}>Create</Button>
        </form>
      </Card>

      {props.accounts.length === 0 ? (
        <Card padding="md" radius="3xl" variant="outline">
          <p className="text-sm text-green-700/70">Add a bank account in Finance settings before reconciling transactions.</p>
        </Card>
      ) : null}

      <section aria-labelledby="unmatched-heading">
        <h3 id="unmatched-heading" className="font-heading text-sm font-bold text-green-900">Unmatched items</h3>
        {selectedBankTxnId ? (
          <p className="mt-1 text-xs text-green-700/60">Matching payments and settlements to the selected bank transaction.</p>
        ) : (
          <p className="mt-1 text-xs text-green-700/60">Select a bank transaction first, then match a payment or settlement.</p>
        )}
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <UnmatchedList
            title="Bank transactions"
            items={props.unmatched.bankTransactions.map((t) => ({
              id: t.id,
              label: `${t.reference ?? "—"} · ${formatMoney(Number(t.amount))}`,
              selected: selectedBankTxnId === t.id,
              onSelect: () => setSelectedBankTxnId(t.id),
            }))}
          />
          <UnmatchedList
            title="Payments"
            items={props.unmatched.payments.map((p) => ({
              id: p.id,
              label: `${p.gateway_txn_id ?? p.id.slice(0, 8)} · ${formatMoney(Number(p.amount))}`,
              action: selectedBankTxnId
                ? () => matchBankTransaction(selectedBankTxnId, p.id)
                : undefined,
            }))}
            onMatch={run}
            pending={pending}
          />
          <UnmatchedList
            title="Settlements"
            items={props.unmatched.settlements.map((s) => ({
              id: s.id,
              label: `${s.bank_reference ?? s.settlement_date} · ${formatMoney(Number(s.received_amount))}`,
              action: selectedBankTxnId
                ? () => matchBankTransaction(selectedBankTxnId, undefined, s.id)
                : undefined,
            }))}
            onMatch={run}
            pending={pending}
          />
        </div>
      </section>

      <section aria-labelledby="recon-history-heading">
        <h3 id="recon-history-heading" className="font-heading text-sm font-bold text-green-900">Reconciliation history</h3>
        {props.reconciliations.length === 0 ? (
          <p className="mt-2 text-sm text-green-700/60">No reconciliations yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {props.reconciliations.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cream-100 p-3">
                <span>{r.bankAccountName} · {r.statementDate} · {formatMoney(r.openingBalance)} → {formatMoney(r.closingBalance)}</span>
                <div className="flex items-center gap-2">
                  <ReconciliationStatusBadge status={r.status} />
                  {r.unmatchedCount > 0 && <Badge variant="warning" size="sm">{r.unmatchedCount} unmatched</Badge>}
                  {r.status !== "reconciled" && (
                    <button type="button" disabled={pending} onClick={() => run(() => manualReconcile(r.id))} className="text-xs text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded px-1">Reconcile</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="bank-tx-heading">
        <h3 id="bank-tx-heading" className="font-heading text-sm font-bold text-green-900">Recent bank transactions</h3>
        {props.transactions.length === 0 ? (
          <p className="mt-2 text-sm text-green-700/60">No transactions.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {props.transactions.slice(0, 15).map((t) => (
              <li key={t.id} className="flex justify-between gap-2 rounded-xl bg-cream-50 px-3 py-2">
                <span>{t.transactionDate} · {t.description ?? t.reference ?? "—"}</span>
                <span className={t.type === "credit" ? "text-green-700" : "text-terra-700"}>{t.type === "credit" ? "+" : "-"}{formatMoney(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function UnmatchedList({
  title,
  items,
  onMatch,
  pending,
}: {
  title: string;
  items: {
    id: string;
    label: string;
    action?: () => Promise<{ ok: boolean; error: string | null }>;
    selected?: boolean;
    onSelect?: () => void;
  }[];
  onMatch?: (a: () => Promise<{ ok: boolean; error: string | null }>) => void;
  pending?: boolean;
}) {
  return (
    <Card padding="md" radius="3xl" variant="outline">
      <h4 className="font-heading text-xs font-bold text-green-900">{title}</h4>
      {items.length === 0 ? <p className="mt-2 text-xs text-green-700/60">None</p> : (
        <ul className="mt-2 space-y-1 text-xs">
          {items.slice(0, 8).map((item) => (
            <li key={item.id} className="flex justify-between gap-1">
              {item.onSelect ? (
                <button
                  type="button"
                  onClick={item.onSelect}
                  className={cn(
                    "truncate text-left",
                    item.selected ? "font-semibold text-green-900" : "text-green-800 hover:underline",
                  )}
                >
                  {item.label}
                </button>
              ) : (
                <span className="truncate text-green-800">{item.label}</span>
              )}
              {item.action && onMatch ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onMatch(item.action!)}
                  className="shrink-0 text-green-700 hover:underline disabled:opacity-50"
                >
                  Match
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
