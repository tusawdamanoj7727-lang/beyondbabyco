-- =====================================================================
-- 049_inventory_reservations.sql
-- Production-grade checkout reservations: hold stock in inventory.reserved
-- for 15 minutes, commit on payment, release on failure/expiry.
-- Safe to re-run.
-- =====================================================================

create table if not exists public.inventory_reservations (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  warehouse_id       uuid not null references public.warehouses(id) on delete cascade,
  quantity           integer not null check (quantity > 0),
  status             text not null default 'active'
    check (status in ('active', 'committed', 'released', 'expired')),
  expires_at         timestamptz not null,
  committed_at       timestamptz,
  released_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint inventory_reservations_order_variant_unique unique (order_id, product_variant_id)
);

create index if not exists idx_inventory_reservations_order
  on public.inventory_reservations(order_id);

create index if not exists idx_inventory_reservations_expires_active
  on public.inventory_reservations(expires_at)
  where status = 'active';

-- Prevent reserved exceeding on-hand quantity
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_reserved_lte_quantity'
      and conrelid = 'public.inventory'::regclass
  ) then
    alter table public.inventory
      add constraint inventory_reserved_lte_quantity check (reserved <= quantity);
  end if;
end $$;

-- Reserve all lines for an order (all-or-nothing). Increments inventory.reserved only.
create or replace function public.reserve_order_inventory(
  p_order_id uuid,
  p_lines jsonb,
  p_ttl_minutes integer default 15
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line jsonb;
  v_variant_id uuid;
  v_qty integer;
  v_warehouse_id uuid;
  v_available integer;
  v_product_id uuid;
  v_expires_at timestamptz;
begin
  if p_order_id is null or p_lines is null or jsonb_array_length(p_lines) = 0 then
    return false;
  end if;

  -- Idempotent checkout retry for the same order.
  if exists (
    select 1 from public.inventory_reservations ir
    where ir.order_id = p_order_id and ir.status in ('active', 'committed')
  ) then
    return true;
  end if;

  v_warehouse_id := public.default_warehouse_id();
  if v_warehouse_id is null then
    return false;
  end if;

  v_expires_at := now() + make_interval(mins => greatest(coalesce(p_ttl_minutes, 15), 1));

  -- Phase 1: validate availability (row locks)
  for v_line in select value from jsonb_array_elements(p_lines) as t(value)
  loop
    v_variant_id := (v_line->>'variant_id')::uuid;
    v_qty := (v_line->>'quantity')::integer;

    if v_variant_id is null or v_qty is null or v_qty <= 0 then
      return false;
    end if;

    select pv.product_id into v_product_id
    from public.product_variants pv
    where pv.id = v_variant_id and pv.is_active = true;

    if v_product_id is null then
      return false;
    end if;

    insert into public.inventory (product_variant_id, warehouse_id, quantity, reserved)
    values (v_variant_id, v_warehouse_id, 0, 0)
    on conflict (product_variant_id, warehouse_id) do nothing;

    select greatest(i.quantity - i.reserved, 0)
    into v_available
    from public.inventory i
    where i.product_variant_id = v_variant_id
      and i.warehouse_id = v_warehouse_id
    for update;

    if v_available is null or v_available < v_qty then
      return false;
    end if;
  end loop;

  -- Phase 2: apply reservations
  for v_line in select value from jsonb_array_elements(p_lines) as t(value)
  loop
    v_variant_id := (v_line->>'variant_id')::uuid;
    v_qty := (v_line->>'quantity')::integer;

    select pv.product_id into v_product_id
    from public.product_variants pv
    where pv.id = v_variant_id;

    update public.inventory
    set reserved = reserved + v_qty, updated_at = now()
    where product_variant_id = v_variant_id
      and warehouse_id = v_warehouse_id
      and reserved + v_qty <= quantity;

    if not found then
      raise exception 'inventory_reservation_failed';
    end if;

    insert into public.inventory_reservations (
      order_id, product_variant_id, warehouse_id, quantity, status, expires_at
    ) values (
      p_order_id, v_variant_id, v_warehouse_id, v_qty, 'active', v_expires_at
    );

    perform public.sync_product_stock(v_product_id);
  end loop;

  return true;
exception
  when others then
    perform public.release_order_inventory(p_order_id, 'released');
    return false;
end;
$$;

-- Convert active reservations into a sale (payment captured / COD confirmed).
create or replace function public.commit_order_inventory(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_product_id uuid;
begin
  if p_order_id is null then
    return false;
  end if;

  if not exists (
    select 1 from public.inventory_reservations
    where order_id = p_order_id and status = 'active'
  ) then
    -- Already committed for this order.
    if exists (
      select 1 from public.inventory_reservations
      where order_id = p_order_id and status = 'committed'
    ) then
      return true;
    end if;
    return false;
  end if;

  for v_row in
    select ir.product_variant_id, ir.warehouse_id, ir.quantity
    from public.inventory_reservations ir
    where ir.order_id = p_order_id and ir.status = 'active'
    for update
  loop
    select pv.product_id into v_product_id
    from public.product_variants pv
    where pv.id = v_row.product_variant_id;

    update public.inventory
    set
      quantity = quantity - v_row.quantity,
      reserved = reserved - v_row.quantity,
      updated_at = now()
    where product_variant_id = v_row.product_variant_id
      and warehouse_id = v_row.warehouse_id
      and quantity >= v_row.quantity
      and reserved >= v_row.quantity;

    if not found then
      raise exception 'inventory_commit_failed';
    end if;

    update public.inventory_reservations
    set status = 'committed', committed_at = now(), updated_at = now()
    where order_id = p_order_id
      and product_variant_id = v_row.product_variant_id
      and status = 'active';

    if v_product_id is not null then
      perform public.sync_product_stock(v_product_id);
    end if;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$$;

-- Release active reservations (payment failed, modal dismissed, manual cancel).
create or replace function public.release_order_inventory(
  p_order_id uuid,
  p_status text default 'released'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_product_id uuid;
  v_final_status text;
begin
  if p_order_id is null then
    return false;
  end if;

  v_final_status := case
    when p_status in ('released', 'expired') then p_status
    else 'released'
  end;

  for v_row in
    select ir.product_variant_id, ir.warehouse_id, ir.quantity
    from public.inventory_reservations ir
    where ir.order_id = p_order_id and ir.status = 'active'
    for update
  loop
    select pv.product_id into v_product_id
    from public.product_variants pv
    where pv.id = v_row.product_variant_id;

    update public.inventory
    set reserved = reserved - v_row.quantity, updated_at = now()
    where product_variant_id = v_row.product_variant_id
      and warehouse_id = v_row.warehouse_id
      and reserved >= v_row.quantity;

    if not found then
      raise exception 'inventory_release_failed';
    end if;

    update public.inventory_reservations
    set status = v_final_status, released_at = now(), updated_at = now()
    where order_id = p_order_id
      and product_variant_id = v_row.product_variant_id
      and status = 'active';

    if v_product_id is not null then
      perform public.sync_product_stock(v_product_id);
    end if;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$$;

-- Restore committed stock when a pre-fulfillment order is cancelled.
create or replace function public.restore_committed_order_inventory(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_product_id uuid;
begin
  if p_order_id is null then
    return false;
  end if;

  for v_row in
    select ir.product_variant_id, ir.warehouse_id, ir.quantity
    from public.inventory_reservations ir
    where ir.order_id = p_order_id and ir.status = 'committed'
    for update
  loop
    select pv.product_id into v_product_id
    from public.product_variants pv
    where pv.id = v_row.product_variant_id;

    update public.inventory
    set quantity = quantity + v_row.quantity, updated_at = now()
    where product_variant_id = v_row.product_variant_id
      and warehouse_id = v_row.warehouse_id;

    update public.inventory_reservations
    set status = 'released', released_at = now(), updated_at = now()
    where order_id = p_order_id
      and product_variant_id = v_row.product_variant_id
      and status = 'committed';

    if v_product_id is not null then
      perform public.sync_product_stock(v_product_id);
    end if;
  end loop;

  return true;
end;
$$;

-- Cron: expire stale reservations and cancel unpaid pending orders.
create or replace function public.expire_stale_inventory_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_count integer := 0;
begin
  for v_order_id in
    select distinct ir.order_id
    from public.inventory_reservations ir
    join public.orders o on o.id = ir.order_id
    where ir.status = 'active'
      and ir.expires_at < now()
      and o.status = 'pending'
  loop
    perform public.release_order_inventory(v_order_id, 'expired');

    update public.orders
    set status = 'cancelled', updated_at = now()
    where id = v_order_id and status = 'pending';

    insert into public.order_events (order_id, type, message, metadata)
    values (
      v_order_id,
      'inventory',
      'Reservation expired — stock released.',
      jsonb_build_object('reason', 'reservation_expired')
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Legacy helper: reserve only (no hard decrement). Used by non-order callers if any.
create or replace function public.check_and_reserve_stock(
  p_variant_id uuid,
  p_qty integer
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
  if p_variant_id is null or p_qty is null or p_qty <= 0 then
    return false;
  end if;

  v_warehouse_id := public.default_warehouse_id();
  if v_warehouse_id is null then
    return false;
  end if;

  select pv.product_id into v_product_id
  from public.product_variants pv
  where pv.id = p_variant_id and pv.is_active = true;

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

  if v_available is null or v_available < p_qty then
    return false;
  end if;

  update public.inventory
  set reserved = reserved + p_qty, updated_at = now()
  where product_variant_id = p_variant_id
    and warehouse_id = v_warehouse_id
    and reserved + p_qty <= quantity;

  if not found then
    return false;
  end if;

  perform public.sync_product_stock(v_product_id);
  return true;
end;
$$;

grant execute on function public.reserve_order_inventory(uuid, jsonb, integer) to service_role;
grant execute on function public.commit_order_inventory(uuid) to service_role;
grant execute on function public.release_order_inventory(uuid, text) to service_role;
grant execute on function public.restore_committed_order_inventory(uuid) to service_role;
grant execute on function public.expire_stale_inventory_reservations() to service_role;
grant execute on function public.check_and_reserve_stock(uuid, integer) to service_role;
