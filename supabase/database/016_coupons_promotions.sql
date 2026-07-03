-- =====================================================================
-- 016_coupons_promotions.sql
-- Phase 4.14 — Enterprise Coupons & Promotions
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- coupons — enterprise fields
-- ---------------------------------------------------------------------
alter table coupons
  add column if not exists name                 text,
  add column if not exists description          text,
  add column if not exists promo_type           text,
  add column if not exists timezone             text not null default 'Asia/Kolkata',
  add column if not exists max_discount         numeric(12,2) check (max_discount is null or max_discount >= 0),
  add column if not exists per_customer_limit   integer check (per_customer_limit is null or per_customer_limit >= 0),
  add column if not exists first_order_only     boolean not null default false,
  add column if not exists logged_in_only       boolean not null default false,
  add column if not exists eligibility          jsonb not null default '{}'::jsonb,
  add column if not exists allow_stack          boolean not null default false,
  add column if not exists priority             integer not null default 0,
  add column if not exists is_exclusive         boolean not null default false,
  add column if not exists auto_apply           boolean not null default false,
  add column if not exists auto_conditions      jsonb not null default '{}'::jsonb,
  add column if not exists buy_x_get_y          jsonb not null default '{}'::jsonb,
  add column if not exists free_shipping        jsonb not null default '{}'::jsonb,
  add column if not exists lifecycle_status     text not null default 'draft'
    check (lifecycle_status in ('draft','active','archived')),
  add column if not exists deleted_at           timestamptz,
  add column if not exists total_revenue        numeric(14,2) not null default 0 check (total_revenue >= 0);

update coupons set name = code where name is null;
update coupons set promo_type = case
  when type::text = 'percent' then 'percentage'
  when type::text = 'fixed' then 'fixed_amount'
  else 'percentage'
end where promo_type is null;

update coupons set lifecycle_status = case
  when is_active then 'active'
  else 'draft'
end where lifecycle_status = 'draft' and is_active = true;

create index if not exists idx_coupons_promo_type   on coupons(promo_type);
create index if not exists idx_coupons_lifecycle    on coupons(lifecycle_status);
create index if not exists idx_coupons_starts       on coupons(starts_at);
create index if not exists idx_coupons_expires      on coupons(expires_at);
create index if not exists idx_coupons_deleted      on coupons(deleted_at) where deleted_at is not null;

-- ---------------------------------------------------------------------
-- coupon_usage — discount tracking
-- ---------------------------------------------------------------------
alter table coupon_usage
  add column if not exists discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  add column if not exists order_subtotal  numeric(14,2);

create index if not exists idx_coupon_usage_customer on coupon_usage(customer_id);
create index if not exists idx_coupon_usage_order    on coupon_usage(order_id);

-- ---------------------------------------------------------------------
-- gift_cards — issuance fields
-- ---------------------------------------------------------------------
alter table gift_cards
  add column if not exists customer_id      uuid references customers(id) on delete set null,
  add column if not exists issued_to_email  text,
  add column if not exists issued_by        uuid references profiles(id) on delete set null,
  add column if not exists notes              text,
  add column if not exists name               text;

alter table gift_card_transactions
  add column if not exists notes       text,
  add column if not exists created_by    uuid references profiles(id) on delete set null;

create index if not exists idx_gift_cards_customer on gift_cards(customer_id);
create index if not exists idx_gift_cards_active   on gift_cards(is_active);

-- ---------------------------------------------------------------------
-- Permission already seeded: marketing.manage
-- ---------------------------------------------------------------------
do $$
begin
  execute 'drop policy if exists manager_all on public.coupons';
  execute 'create policy manager_all on public.coupons for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.coupon_usage';
  execute 'create policy manager_all on public.coupon_usage for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.gift_cards';
  execute 'create policy manager_all on public.gift_cards for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.gift_card_transactions';
  execute 'create policy manager_all on public.gift_card_transactions for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
exception when others then null;
end $$;
