import OperationsIntegrationsClient from "@/components/admin/operations/OperationsIntegrationsClient";
import { getOperationsOverview } from "@/lib/admin/operations";
import { isProduction } from "@/lib/env.validation";

export default async function OperationsIntegrationsPage() {
  const data = await getOperationsOverview();

  return <OperationsIntegrationsClient data={data} allowSampleError={!isProduction()} />;
}
