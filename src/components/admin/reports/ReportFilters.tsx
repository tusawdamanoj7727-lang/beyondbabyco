"use client";

import { useRouter } from "next/navigation";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import type { FilterOptions, ReportFilters } from "@/lib/admin/report-types";

export default function ReportFiltersBar({
  filters,
  options,
  basePath,
}: {
  filters: ReportFilters;
  options: FilterOptions;
  basePath: string;
}) {
  const router = useRouter();

  function push(patch: Partial<ReportFilters>) {
    const sp = new URLSearchParams();
    const merged = { ...filters, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    router.push(`${basePath}?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-cream-200 bg-white p-4 lg:flex-row lg:flex-wrap lg:items-end" role="search" aria-label="Report filters">
      <FilterField label="From">
        <input type="date" aria-label="Date from" value={filters.dateFrom ?? ""} onChange={(e) => push({ dateFrom: e.target.value || undefined })} className={fieldControlClasses} />
      </FilterField>
      <FilterField label="To">
        <input type="date" aria-label="Date to" value={filters.dateTo ?? ""} onChange={(e) => push({ dateTo: e.target.value || undefined })} className={fieldControlClasses} />
      </FilterField>
      <FilterField label="Warehouse">
        <Select aria-label="Warehouse" value={filters.warehouseId ?? ""} onChange={(e) => push({ warehouseId: e.target.value || undefined })} className="min-w-[140px]">
          <option value="">All</option>
          {options.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
      </FilterField>
      <FilterField label="Category">
        <Select aria-label="Category" value={filters.categoryId ?? ""} onChange={(e) => push({ categoryId: e.target.value || undefined })} className="min-w-[140px]">
          <option value="">All</option>
          {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </FilterField>
      <FilterField label="Brand">
        <Select aria-label="Brand" value={filters.brandId ?? ""} onChange={(e) => push({ brandId: e.target.value || undefined })} className="min-w-[140px]">
          <option value="">All</option>
          {options.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </FilterField>
      <FilterField label="Product">
        <Select aria-label="Product" value={filters.productId ?? ""} onChange={(e) => push({ productId: e.target.value || undefined })} className="min-w-[140px]">
          <option value="">All</option>
          {options.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </FilterField>
      <FilterField label="Customer">
        <Select aria-label="Customer" value={filters.customerId ?? ""} onChange={(e) => push({ customerId: e.target.value || undefined })} className="min-w-[140px]">
          <option value="">All</option>
          {options.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </FilterField>
      <FilterField label="Carrier">
        <Select aria-label="Carrier" value={filters.carrierId ?? ""} onChange={(e) => push({ carrierId: e.target.value || undefined })} className="min-w-[140px]">
          <option value="">All</option>
          {options.carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </FilterField>
      <FilterField label="Gateway">
        <Select aria-label="Gateway" value={filters.gatewayId ?? ""} onChange={(e) => push({ gatewayId: e.target.value || undefined })} className="min-w-[140px]">
          <option value="">All</option>
          {options.gateways.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
      </FilterField>
      <FilterField label="Coupon">
        <Select aria-label="Coupon" value={filters.couponId ?? ""} onChange={(e) => push({ couponId: e.target.value || undefined })} className="min-w-[140px]">
          <option value="">All</option>
          {options.coupons.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </FilterField>
      <FilterField label="Country">
        <Select aria-label="Country" value={filters.country ?? ""} onChange={(e) => push({ country: e.target.value || undefined })} className="min-w-[120px]">
          <option value="">All</option>
          {options.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </FilterField>
      <FilterField label="State">
        <Select aria-label="State" value={filters.state ?? ""} onChange={(e) => push({ state: e.target.value || undefined })} className="min-w-[120px]">
          <option value="">All</option>
          {options.states.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </FilterField>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs">
      <span className="mb-1 block font-medium text-green-700/60">{label}</span>
      {children}
    </label>
  );
}
