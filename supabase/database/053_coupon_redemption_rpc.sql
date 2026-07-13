-- =====================================================================
-- 053_coupon_redemption_rpc.sql
-- Trusted server-side coupon redemption (service_role only).
-- Customers never write coupon_usage directly; checkout uses this RPC.
-- Safe to re-run.
-- =====================================================================

create unique index if not exists idx_coupon_usage_order_unique
  on public.coupon_usage(order_id)
  where order_id is not null;

-- Atomically redeem a coupon for a pending storefront order.
-- Returns NULL on success, or a short error message.
create or replace function public.redeem_coupon_for_order(
  p_order_id uuid,
  p_coupon_id uuid,
  p_customer_id uuid,
  p_discount_amount numeric,
  p_order_subtotal numeric
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_coupon record;
  v_customer_usage integer;
begin
  if p_order_id is null or p_coupon_id is null then
    return 'Invalid coupon redemption request.';
  end if;

  -- Idempotent checkout retry for the same order.
  if exists (
    select 1 from public.coupon_usage cu where cu.order_id = p_order_id
  ) then
    return null;
  end if;

  select o.id, o.customer_id, o.coupon_id, o.status
  into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_order.id is null then
    return 'Order not found.';
  end if;

  if p_customer_id is not null and v_order.customer_id is distinct from p_customer_id then
    return 'Order not found.';
  end if;

  if v_order.coupon_id is distinct from p_coupon_id then
    return 'Coupon does not match this order.';
  end if;

  if v_order.status not in ('pending', 'confirmed', 'processing') then
    return 'Order cannot accept coupon redemption.';
  end if;

  select
    c.id,
    c.used_count,
    c.max_uses,
    c.per_customer_limit,
    c.is_active,
    c.deleted_at
  into v_coupon
  from public.coupons c
  where c.id = p_coupon_id
  for update;

  if v_coupon.id is null then
    return 'Coupon not found.';
  end if;

  if v_coupon.deleted_at is not null or not v_coupon.is_active then
    return 'Coupon is no longer available.';
  end if;

  if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
    return 'Usage limit reached.';
  end if;

  if v_coupon.per_customer_limit is not null and p_customer_id is not null then
    select count(*)::integer
    into v_customer_usage
    from public.coupon_usage cu
    where cu.coupon_id = p_coupon_id
      and cu.customer_id = p_customer_id;

    if v_customer_usage >= v_coupon.per_customer_limit then
      return 'Per-customer usage limit reached.';
    end if;
  end if;

  insert into public.coupon_usage (
    coupon_id,
    customer_id,
    order_id,
    discount_amount,
    order_subtotal
  ) values (
    p_coupon_id,
    p_customer_id,
    p_order_id,
    greatest(coalesce(p_discount_amount, 0), 0),
    p_order_subtotal
  );

  update public.coupons
  set
    used_count = used_count + 1,
    total_revenue = total_revenue + greatest(coalesce(p_discount_amount, 0), 0),
    updated_at = now()
  where id = p_coupon_id;

  return null;
exception
  when unique_violation then
    -- Concurrent redeem for the same order — treat as success.
    return null;
end;
$$;

-- Reverse redemption when a pending order is cancelled (abandon / expiry).
create or replace function public.release_coupon_for_order(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage record;
  v_coupon record;
begin
  if p_order_id is null then
    return null;
  end if;

  for v_usage in
    select cu.id, cu.coupon_id, cu.discount_amount
    from public.coupon_usage cu
    where cu.order_id = p_order_id
    for update
  loop
    select c.used_count, c.total_revenue
    into v_coupon
    from public.coupons c
    where c.id = v_usage.coupon_id
    for update;

    if v_coupon is not null then
      update public.coupons
      set
        used_count = greatest(used_count - 1, 0),
        total_revenue = greatest(total_revenue - coalesce(v_usage.discount_amount, 0), 0),
        updated_at = now()
      where id = v_usage.coupon_id;
    end if;

    delete from public.coupon_usage where id = v_usage.id;
  end loop;

  return null;
end;
$$;

revoke all on function public.redeem_coupon_for_order(uuid, uuid, uuid, numeric, numeric) from public;
revoke all on function public.redeem_coupon_for_order(uuid, uuid, uuid, numeric, numeric) from anon;
revoke all on function public.redeem_coupon_for_order(uuid, uuid, uuid, numeric, numeric) from authenticated;

grant execute on function public.redeem_coupon_for_order(uuid, uuid, uuid, numeric, numeric) to service_role;

revoke all on function public.release_coupon_for_order(uuid) from public;
revoke all on function public.release_coupon_for_order(uuid) from anon;
revoke all on function public.release_coupon_for_order(uuid) from authenticated;

grant execute on function public.release_coupon_for_order(uuid) to service_role;

-- Release coupon usage when reservation expiry cancels unpaid orders.
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
    perform public.release_coupon_for_order(v_order_id);

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

grant execute on function public.expire_stale_inventory_reservations() to service_role;
