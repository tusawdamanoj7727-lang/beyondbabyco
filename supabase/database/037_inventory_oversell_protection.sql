-- =====================================================================
-- 037_inventory_oversell_protection.sql
-- Non-negative inventory + atomic per-variant stock reservation at checkout.
-- Safe to re-run. Requires product_variants + inventory tables.
-- =====================================================================

-- Prevent negative stock
do $$
begin
  alter table public.inventory
    add constraint inventory_qty_non_negative check (quantity >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.inventory
    add constraint inventory_reserved_non_negative check (reserved >= 0);
exception
  when duplicate_object then null;
end $$;

-- Default fulfillment warehouse (required for stock RPCs)
insert into public.warehouses (name, code, city, state, country, is_active, is_default)
select
  'BeyondBabyCo Fulfillment',
  'BBC-MAIN',
  'Jaipur',
  'Rajasthan',
  'India',
  true,
  true
where not exists (
  select 1 from public.warehouses where is_active = true
);

create or replace function public.default_warehouse_id()
returns uuid
language sql
stable
as $$
  select id
  from public.warehouses
  where is_active = true
  order by is_default desc nulls last, created_at asc
  limit 1;
$$;

-- Atomic single-variant decrement (row lock via FOR UPDATE)
create or replace function public.decrement_stock(
  p_variant_id uuid,
  p_quantity integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_warehouse_id uuid;
  v_available integer;
  v_product_id uuid;
begin
  if p_variant_id is null or p_quantity is null or p_quantity <= 0 then
    return false;
  end if;

  v_warehouse_id := public.default_warehouse_id();
  if v_warehouse_id is null then
    return false;
  end if;

  select pv.product_id into v_product_id
  from public.product_variants pv
  where pv.id = p_variant_id
    and pv.is_active = true;

  if v_product_id is null then
    return false;
  end if;

  insert into public.inventory (product_variant_id, warehouse_id, quantity, reserved)
  values (p_variant_id, v_warehouse_id, 0, 0)
  on conflict (product_variant_id, warehouse_id) do nothing;

  select greatest(i.quantity - i.reserved, 0)
  into v_available
  from public.inventory i
  where i.product_variant_id = p_variant_id
    and i.warehouse_id = v_warehouse_id
  for update;

  if v_available is null or v_available < p_quantity then
    return false;
  end if;

  update public.inventory
  set
    quantity = quantity - p_quantity,
    updated_at = now()
  where product_variant_id = p_variant_id
    and warehouse_id = v_warehouse_id;

  perform public.sync_product_stock(v_product_id);
  return true;
end;
$$;

-- Checkout helper: reserve stock for one variant (returns false if insufficient)
create or replace function public.check_and_reserve_stock(
  p_variant_id uuid,
  p_qty integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.decrement_stock(p_variant_id, p_qty);
end;
$$;

grant execute on function public.check_and_reserve_stock(uuid, integer) to service_role;
grant execute on function public.decrement_stock(uuid, integer) to service_role;
