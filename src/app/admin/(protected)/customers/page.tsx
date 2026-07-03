import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  CUSTOMER_SORTABLE_COLUMNS,
  getCustomerDashboard,
  getCustomerFilterOptions,
  listCustomers,
  type CustomerSortColumn,
} from "@/lib/admin/customers";
import { CUSTOMER_STATUSES, type CustomerStatus } from "@/lib/admin/customer-types";
import CustomersClient from "./CustomersClient";

export const metadata: Metadata = { title: "Customers" };

function parseSort(v: string | undefined): CustomerSortColumn {
  return (CUSTOMER_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "") ? (v as CustomerSortColumn) : "created_at";
}

function parseStatus(v: string | undefined): CustomerStatus | "all" {
  return (CUSTOMER_STATUSES as readonly string[]).includes(v ?? "") ? (v as CustomerStatus) : "all";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);

  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);
  const trash = sp.trash === "1";

  const [result, dashboard, filterOptions] = await Promise.all([
    listCustomers({
      search: sp.q ?? "",
      city: sp.city,
      state: sp.state,
      country: sp.country,
      status: parseStatus(sp.status),
      newsletter: sp.newsletter === "1",
      vip: sp.vip === "1",
      dateFrom: sp.from,
      dateTo: sp.to,
      sort,
      dir,
      page,
      trash,
    }),
    getCustomerDashboard(),
    getCustomerFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        description="Manage customer profiles, segments, and CRM activity"
        actions={
          <Link
            href="/admin/customers/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Add Customer
          </Link>
        }
      />

      <CustomersClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        filterOptions={filterOptions}
        filters={{
          search: sp.q ?? "",
          city: sp.city ?? "",
          state: sp.state ?? "",
          country: sp.country ?? "",
          status: parseStatus(sp.status),
          newsletter: sp.newsletter === "1",
          vip: sp.vip === "1",
          dateFrom: sp.from ?? "",
          dateTo: sp.to ?? "",
        }}
        sort={sort}
        dir={dir}
        trash={trash}
      />
    </div>
  );
}
