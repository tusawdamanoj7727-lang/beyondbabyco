import { listLedgerEntries, listJournalEntries } from "@/lib/admin/finance";
import type { LedgerType } from "@/lib/admin/finance-types";
import LedgerClient from "./LedgerClient";

export default async function LedgerPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const ledgerType = (["all", "general", "sales", "purchase", "gst", "customer", "vendor"] as const).includes(sp.ledgerType as LedgerType | "all")
    ? (sp.ledgerType as LedgerType | "all")
    : "all";

  const [result, journals] = await Promise.all([
    listLedgerEntries({ ledgerType, search: sp.search, page }),
    listJournalEntries(20),
  ]);

  return (
    <LedgerClient
      entries={result.rows}
      journals={journals}
      total={result.total}
      page={result.page}
      perPage={result.perPage}
      pageCount={result.pageCount}
      ledgerType={ledgerType}
      search={sp.search ?? ""}
    />
  );
}
