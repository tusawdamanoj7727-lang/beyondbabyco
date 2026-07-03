import { listFinanceVendors, getVendorPayments } from "@/lib/admin/finance";
import VendorsClient from "./VendorsClient";

export default async function VendorsPage() {
  const [vendors, payments] = await Promise.all([listFinanceVendors(), getVendorPayments()]);
  return <VendorsClient vendors={vendors} payments={payments} />;
}
