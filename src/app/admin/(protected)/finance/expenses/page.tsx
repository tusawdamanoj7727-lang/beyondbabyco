import { listExpenses, getExpenseFilterOptions } from "@/lib/admin/finance";
import type { ExpensePaymentStatus } from "@/lib/admin/finance-types";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const paymentStatus = (["all", "unpaid", "partial", "paid", "scheduled"] as const).includes(sp.paymentStatus as ExpensePaymentStatus | "all")
    ? (sp.paymentStatus as ExpensePaymentStatus | "all")
    : "all";

  const [result, options] = await Promise.all([
    listExpenses({ search: sp.search, category: sp.category, vendorId: sp.vendorId, paymentStatus, page }),
    getExpenseFilterOptions(),
  ]);

  return (
    <ExpensesClient
      rows={result.rows}
      total={result.total}
      page={result.page}
      perPage={result.perPage}
      pageCount={result.pageCount}
      vendors={options.vendors}
      filters={{ search: sp.search ?? "", category: sp.category ?? "", vendorId: sp.vendorId ?? "", paymentStatus }}
    />
  );
}
