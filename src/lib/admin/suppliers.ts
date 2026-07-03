import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const SUPPLIER_SORTABLE_COLUMNS = ["name", "country", "updated_at", "created_at"] as const;
export type SupplierSortColumn = (typeof SUPPLIER_SORTABLE_COLUMNS)[number];

export interface SupplierListItem {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  country: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface SupplierEditData {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  country: string | null;
  website: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface SupplierListResult {
  rows: SupplierListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export async function listSuppliers(params: {
  search?: string;
  active?: boolean | "all";
  sort?: SupplierSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}): Promise<SupplierListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort = params.sort ?? "name";
  const ascending = params.dir ? params.dir === "asc" : true;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("suppliers")
    .select("id,name,contact_name,email,phone,gstin,country,is_active,updated_at", { count: "exact" });

  if (params.search?.trim()) {
    const q = params.search.trim().replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%,gstin.ilike.%${q}%`);
  }
  if (params.active === true) query = query.eq("is_active", true);
  if (params.active === false) query = query.eq("is_active", false);

  const { data, count, error } = await query.order(sort, { ascending }).range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  return {
    rows: (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      contactName: r.contact_name,
      email: r.email,
      phone: r.phone,
      gstin: r.gstin,
      country: r.country,
      isActive: r.is_active,
      updatedAt: r.updated_at,
    })),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getSupplierForEdit(id: string): Promise<SupplierEditData | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("suppliers").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    contactName: data.contact_name,
    email: data.email,
    phone: data.phone,
    gstin: data.gstin,
    address: data.address,
    country: data.country,
    website: data.website,
    notes: data.notes,
    isActive: data.is_active,
  };
}

export async function getSupplierOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id,name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  return data ?? [];
}
