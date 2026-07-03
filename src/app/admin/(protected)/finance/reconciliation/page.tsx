import { getReconciliationData } from "@/lib/admin/finance";
import { ensureDefaultBankAccount } from "@/lib/admin/finance-actions";
import ReconciliationClient from "./ReconciliationClient";

export default async function ReconciliationPage() {
  await ensureDefaultBankAccount();
  const data = await getReconciliationData();
  return (
    <ReconciliationClient
      accounts={data.accounts}
      transactions={data.transactions}
      reconciliations={data.reconciliations}
      unmatched={data.unmatchedPayments}
    />
  );
}
