-- =====================================================================
-- 032_inventory_atomic_decrement.sql
-- Atomic stock decrement + non-negative constraints.
-- Safe to re-run.
-- =====================================================================

-- Named constraints (inventory.quantity already has inline check in 001)
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

do $$
begin
  alter table public.products
    add constraint products_stock_non_negative check (coalesce(stock, 0) >= 0);
exception
  when duplicate_object then null;
end $$;

-- Resolve default fulfillment warehouse
create or replace function public.default_warehouse_id()
returns uuid
language sql
stable
as $$
  select id
  from public.warehouses
  where is_active = true
  order by is_default desc, created_at asc
  limit 1;
$$;

-- Keep products.stock in sync with sellable inventory (quantity - reserved)
create or replace function public.sync_product_stock(p_product_id uuid)
returns void
language sql
as $$
  update public.products p
  set
    stock = coalesce(
      (
        select sum(greatest(i.quantity - i.reserved, 0))::integer
        from public.product_variants pv
        join public.inventory i on i.product_variant_id = pv.id
        where pv.product_id = p_product_id
          and pv.is_active = true
      ),
      0
    ),
    updated_at = now()
  where p.id = p_product_id;
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

create or replace function public.restore_stock(
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
  where pv.id = p_variant_id;

  if v_product_id is null then
    return false;
  end if;

  update public.inventory
  set
    quantity = quantity + p_quantity,
    updated_at = now()
  where product_variant_id = p_variant_id
    and warehouse_id = v_warehouse_id;

  perform public.sync_product_stock(v_product_id);
  return true;
end;
$$;

-- All-or-nothing decrement for checkout (validates all lines before updating any)
create or replace function public.decrement_order_lines(p_lines jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_warehouse_id uuid;
  r record;
  v_available integer;
  v_product_ids uuid[] := array[]::uuid[];
  v_line_count integer;
  v_valid_count integer;
begin
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    return false;
  end if;

  v_line_count := jsonb_array_length(p_lines);
  if v_line_count = 0 then
    return false;
  end if;

  v_warehouse_id := public.default_warehouse_id();
  if v_warehouse_id is null then
    return false;
  end if;

  select count(*)::integer
  into v_valid_count
  from jsonb_array_elements(p_lines) as elem
  join public.product_variants pv on pv.id = (elem->>'variant_id')::uuid and pv.is_active = true
  where (elem->>'quantity')::integer > 0;

  if v_valid_count <> v_line_count then
    return false;
  end if;

  for r in
    select
      (elem->>'variant_id')::uuid as variant_id,
      (elem->>'quantity')::integer as qty,
      pv.product_id
    from jsonb_array_elements(p_lines) as elem
    join public.product_variants pv on pv.id = (elem->>'variant_id')::uuid
  loop
    insert into public.inventory (product_variant_id, warehouse_id, quantity, reserved)
    values (r.variant_id, v_warehouse_id, 0, 0)
    on conflict (product_variant_id, warehouse_id) do nothing;

    select greatest(i.quantity - i.reserved, 0)
    into v_available
    from public.inventory i
    where i.product_variant_id = r.variant_id
      and i.warehouse_id = v_warehouse_id
    for update;

    if v_available is null or v_available < r.qty then
      return false;
    end if;

    v_product_ids := array_append(v_product_ids, r.product_id);
  end loop;

  for r in
    select
      (elem->>'variant_id')::uuid as variant_id,
      (elem->>'quantity')::integer as qty
    from jsonb_array_elements(p_lines) as elem
  loop
    update public.inventory
    set
      quantity = quantity - r.qty,
      updated_at = now()
    where product_variant_id = r.variant_id
      and warehouse_id = v_warehouse_id;
  end loop;

  perform public.sync_product_stock(pid)
  from (select distinct unnest(v_product_ids) as pid) s;

  return true;
end;
$$;

-- Seed inventory rows from products.stock for active launch SKUs (split evenly per variant)
insert into public.inventory (product_variant_id, warehouse_id, quantity, reserved)
select
  pv.id,
  wh.id,
  greatest(
    floor(coalesce(p.stock, 0)::numeric / nullif(vc.variant_count, 0))::integer,
    0
  ),
  0
from public.products p
join public.product_variants pv on pv.product_id = p.id and pv.is_active = true
join (
  select product_id, count(*)::integer as variant_count
  from public.product_variants
  where is_active = true
  group by product_id
) vc on vc.product_id = p.id
cross join lateral (
  select public.default_warehouse_id() as id
) wh
where p.status = 'active'
  and p.deleted_at is null
  and coalesce(p.stock, 0) > 0
  and wh.id is not null
on conflict (product_variant_id, warehouse_id) do update
set
  quantity = greatest(
    excluded.quantity,
    public.inventory.quantity
  ),
  updated_at = now();

-- Refresh products.stock from inventory after seed
do $$
declare
  pid uuid;
begin
  for pid in
    select distinct p.id
    from public.products p
    where p.status = 'active'
      and p.deleted_at is null
  loop
    perform public.sync_product_stock(pid);
  end loop;
end $$;

grant execute on function public.decrement_stock(uuid, integer) to service_role;
grant execute on function public.restore_stock(uuid, integer) to service_role;
grant execute on function public.decrement_order_lines(jsonb) to service_role;
