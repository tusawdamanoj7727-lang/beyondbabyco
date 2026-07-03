import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WarehouseStatus } from "./inventory-types";

export const WAREHOUSE_SORTABLE_COLUMNS = ["name", "code", "city", "updated_at", "created_at"] as const;
export type WarehouseSortColumn = (typeof WAREHOUSE_SORTABLE_COLUMNS)[number];

export interface WarehouseListItem {
  id: string;
  name: string;
  code: string;
  city: string | null;
  country: string;
  contactPerson: string | null;
  phone: string | null;
  isDefault: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface WarehouseEditData {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  status: WarehouseStatus;
}

export interface WarehouseListResult {
  rows: WarehouseListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export async function listWarehouses(params: {
  search?: string;
  status?: WarehouseStatus | "all";
  sort?: WarehouseSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}): Promise<WarehouseListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort = params.sort ?? "name";
  const ascending = params.dir ? params.dir === "asc" : true;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("warehouses")
    .select("id,name,code,city,country,contact_person,phone,is_default,is_active,updated_at", { count: "exact" });

  if (params.search?.trim()) {
    const q = params.search.trim().replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,city.ilike.%${q}%`);
  }
  if (params.status === "active") query = query.eq("is_active", true);
  if (params.status === "inactive") query = query.eq("is_active", false);

  const { data, count, error } = await query.order(sort, { ascending }).range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  return {
    rows: (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      city: r.city,
      country: r.country,
      contactPerson: r.contact_person,
      phone: r.phone,
      isDefault: r.is_default,
      isActive: r.is_active,
      updatedAt: r.updated_at,
    })),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getWarehouseForEdit(id: string): Promise<WarehouseEditData | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("warehouses").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    code: data.code,
    address: data.address,
    city: data.city,
    state: data.state,
    country: data.country,
    pincode: data.pincode,
    contactPerson: data.contact_person,
    phone: data.phone,
    email: data.email,
    isDefault: data.is_default,
    status: data.is_active ? "active" : "inactive",
  };
}

export async function getWarehouseOptions(): Promise<{ id: string; name: string; code: string }[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("warehouses")
    .select("id,name,code")
    .eq("is_active", true)
    .order("name", { ascending: true });
  return data ?? [];
}
