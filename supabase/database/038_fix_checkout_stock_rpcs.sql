-- =====================================================================
-- 038_fix_checkout_stock_rpcs.sql
-- Restores sync_product_stock + restore_stock required by decrement_stock (037).
-- Safe to re-run.
-- =====================================================================

create or replace function public.sync_product_stock(p_product_id uuid)
returns void
language sql
security definer
set search_path = public
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

grant execute on function public.sync_product_stock(uuid) to service_role;
grant execute on function public.check_and_reserve_stock(uuid, integer) to service_role;
grant execute on function public.decrement_stock(uuid, integer) to service_role;
grant execute on function public.restore_stock(uuid, integer) to service_role;
