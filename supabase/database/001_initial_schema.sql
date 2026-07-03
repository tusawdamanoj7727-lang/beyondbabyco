-- =====================================================================
-- BeyondBabyCo — 001_initial_schema.sql
-- Enterprise ecommerce schema (tables, types, constraints, defaults).
-- Postgres / Supabase. Run order: 001 -> 002 -> 003 -> 004 -> 005.
-- =====================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";     -- fuzzy text search indexes

-- ---------------------------------------------------------------------
-- Enum types (created idempotently)
-- ---------------------------------------------------------------------
do $$ begin
  create type product_status as enum ('draft','active','archived','coming_soon');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum
    ('pending','confirmed','processing','shipped','delivered','cancelled','refunded','returned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum
    ('pending','authorized','paid','failed','refunded','partially_refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type shipment_status as enum
    ('pending','label_created','in_transit','out_for_delivery','delivered','failed','returned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_type as enum ('percent','fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type movement_type as enum ('in','out','adjustment','transfer');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- AUTH & ACCESS CONTROL
-- =====================================================================
create table if not exists roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists permissions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists role_permissions (
  role_id       uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (role_id, permission_id)
);

-- profiles extends Supabase auth.users 1:1
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role_id    uuid references roles(id) on delete set null,
  full_name  text,
  phone      text,
  avatar_url text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Repair: CREATE IF NOT EXISTS is skipped when a stale profiles table exists
-- without a primary key (common after partial APPLY_ALL / SQL Editor reruns).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'id'
  ) and not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'profiles'
      and con.contype = 'p'
  ) then
    alter table public.profiles add constraint profiles_pkey primary key (id);
  end if;
end $$;

-- =====================================================================
-- CATALOG / PRODUCTS
-- =====================================================================
create table if not exists brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  logo_url    text,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories(id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  brand_id          uuid references brands(id) on delete set null,
  category_id       uuid references categories(id) on delete set null,
  subcategory_id    uuid references subcategories(id) on delete set null,
  name              text not null,
  slug              text not null unique,
  sku               text unique,
  short_description text,
  description       text,
  status            product_status not null default 'draft',
  price             numeric(12,2) not null default 0 check (price >= 0),
  compare_at_price  numeric(12,2) check (compare_at_price >= 0),
  cost_price        numeric(12,2) check (cost_price >= 0),
  currency          char(3) not null default 'INR',
  is_featured       boolean not null default false,
  rating_avg        numeric(3,2) not null default 0 check (rating_avg >= 0 and rating_avg <= 5),
  rating_count      integer not null default 0 check (rating_count >= 0),
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  alt        text,
  position   integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products(id) on delete cascade,
  name             text not null,
  sku              text unique,
  barcode          text,
  price            numeric(12,2) check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price >= 0),
  weight_grams     integer check (weight_grams >= 0),
  position         integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists product_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists product_tag_map (
  product_id uuid not null references products(id) on delete cascade,
  tag_id     uuid not null references product_tags(id) on delete cascade,
  primary key (product_id, tag_id)
);

create table if not exists ingredients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  inci_name   text,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists product_ingredients (
  product_id    uuid not null references products(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  notes         text,
  primary key (product_id, ingredient_id)
);

create table if not exists benefits (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  icon        text,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists product_benefits (
  product_id uuid not null references products(id) on delete cascade,
  benefit_id uuid not null references benefits(id) on delete cascade,
  primary key (product_id, benefit_id)
);

-- =====================================================================
-- INVENTORY & PROCUREMENT
-- =====================================================================
create table if not exists warehouses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique,
  address    text,
  city       text,
  state      text,
  country    text not null default 'India',
  pincode    text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  gstin      text,
  address    text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory (
  id                 uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references product_variants(id) on delete cascade,
  warehouse_id       uuid not null references warehouses(id) on delete cascade,
  quantity           integer not null default 0 check (quantity >= 0),
  reserved           integer not null default 0 check (reserved >= 0),
  reorder_level      integer not null default 0 check (reorder_level >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (product_variant_id, warehouse_id)
);

create table if not exists stock_movements (
  id           uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory(id) on delete cascade,
  type         movement_type not null,
  quantity     integer not null,
  reference    text,
  note         text,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists purchase_orders (
  id           uuid primary key default gen_random_uuid(),
  po_number    text not null unique,
  supplier_id  uuid references suppliers(id) on delete set null,
  warehouse_id uuid references warehouses(id) on delete set null,
  status       text not null default 'draft'
               check (status in ('draft','ordered','received','cancelled')),
  total        numeric(14,2) not null default 0 check (total >= 0),
  ordered_at   timestamptz,
  expected_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id                 uuid primary key default gen_random_uuid(),
  purchase_order_id  uuid not null references purchase_orders(id) on delete cascade,
  product_variant_id uuid not null references product_variants(id) on delete restrict,
  quantity           integer not null check (quantity > 0),
  unit_cost          numeric(12,2) not null check (unit_cost >= 0),
  created_at         timestamptz not null default now()
);

-- =====================================================================
-- CUSTOMERS
-- =====================================================================
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  email      text,
  phone      text,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type        text not null default 'shipping' check (type in ('billing','shipping')),
  full_name   text,
  phone       text,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  country     text not null default 'India',
  pincode     text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists wishlist (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (customer_id, product_id)
);

create table if not exists cart (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (customer_id)
);

create table if not exists cart_items (
  id                 uuid primary key default gen_random_uuid(),
  cart_id            uuid not null references cart(id) on delete cascade,
  product_variant_id uuid not null references product_variants(id) on delete cascade,
  quantity           integer not null default 1 check (quantity > 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (cart_id, product_variant_id)
);

-- =====================================================================
-- ORDERS, PAYMENTS & FULFILLMENT
-- =====================================================================
create table if not exists shipping_methods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  base_rate   numeric(10,2) not null default 0 check (base_rate >= 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists coupons (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  type       discount_type not null,
  value      numeric(12,2) not null check (value >= 0),
  min_order  numeric(12,2) not null default 0 check (min_order >= 0),
  max_uses   integer check (max_uses >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at  timestamptz,
  expires_at timestamptz,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,
  customer_id        uuid references customers(id) on delete set null,
  status             order_status not null default 'pending',
  subtotal           numeric(14,2) not null default 0 check (subtotal >= 0),
  discount_total     numeric(14,2) not null default 0 check (discount_total >= 0),
  tax_total          numeric(14,2) not null default 0 check (tax_total >= 0),
  shipping_total     numeric(14,2) not null default 0 check (shipping_total >= 0),
  grand_total        numeric(14,2) not null default 0 check (grand_total >= 0),
  currency           char(3) not null default 'INR',
  coupon_id          uuid references coupons(id) on delete set null,
  shipping_method_id uuid references shipping_methods(id) on delete set null,
  placed_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  product_id         uuid references products(id) on delete set null,
  product_variant_id uuid references product_variants(id) on delete set null,
  name               text not null,
  sku                text,
  unit_price         numeric(12,2) not null check (unit_price >= 0),
  quantity           integer not null check (quantity > 0),
  tax_rate           numeric(5,2) not null default 0 check (tax_rate >= 0),
  total              numeric(14,2) not null check (total >= 0),
  created_at         timestamptz not null default now()
);

create table if not exists shipping_addresses (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  full_name  text not null,
  phone      text,
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  country    text not null default 'India',
  pincode    text not null,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  provider   text,
  method     text,
  amount     numeric(14,2) not null check (amount >= 0),
  currency   char(3) not null default 'INR',
  status     payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_transactions (
  id         uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  txn_ref    text,
  amount     numeric(14,2) not null check (amount >= 0),
  status     payment_status not null default 'pending',
  raw        jsonb,
  created_at timestamptz not null default now()
);

create table if not exists shipments (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  shipping_method_id uuid references shipping_methods(id) on delete set null,
  carrier            text,
  tracking_number    text,
  status             shipment_status not null default 'pending',
  shipped_at         timestamptz,
  delivered_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists tracking_events (
  id          uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  status      shipment_status not null,
  message     text,
  location    text,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- MARKETING & LOYALTY
-- =====================================================================
create table if not exists coupon_usage (
  id          uuid primary key default gen_random_uuid(),
  coupon_id   uuid not null references coupons(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  order_id    uuid references orders(id) on delete set null,
  used_at     timestamptz not null default now()
);

create table if not exists gift_cards (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  balance         numeric(12,2) not null default 0 check (balance >= 0),
  initial_balance numeric(12,2) not null default 0 check (initial_balance >= 0),
  currency        char(3) not null default 'INR',
  is_active       boolean not null default true,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists gift_card_transactions (
  id           uuid primary key default gen_random_uuid(),
  gift_card_id uuid not null references gift_cards(id) on delete cascade,
  order_id     uuid references orders(id) on delete set null,
  amount       numeric(12,2) not null,
  type         text not null check (type in ('debit','credit')),
  created_at   timestamptz not null default now()
);

create table if not exists loyalty_points (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  points      integer not null default 0,
  reason      text,
  order_id    uuid references orders(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists referrals (
  id                   uuid primary key default gen_random_uuid(),
  referrer_customer_id uuid not null references customers(id) on delete cascade,
  referred_email       text,
  referred_customer_id uuid references customers(id) on delete set null,
  status               text not null default 'pending'
                       check (status in ('pending','completed','expired')),
  reward_points        integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- =====================================================================
-- CMS
-- =====================================================================
create table if not exists homepage_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists homepage_sections (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  title      text,
  position   integer not null default 0,
  is_enabled boolean not null default true,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hero_slides (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  subtitle   text,
  image_url  text,
  cta_label  text,
  cta_url    text,
  position   integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists banners (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  image_url  text,
  link_url   text,
  placement  text,
  position   integer not null default 0,
  is_active  boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists testimonials (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  city         text,
  rating       integer not null default 5 check (rating between 1 and 5),
  text         text not null,
  avatar_url   text,
  is_published boolean not null default false,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists blogs (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  content         text,
  cover_image_url text,
  author_id       uuid references profiles(id) on delete set null,
  status          text not null default 'draft'
                  check (status in ('draft','published','archived')),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists pages (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  slug       text not null unique,
  content    text,
  status     text not null default 'draft'
             check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  category     text,
  position     integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- =====================================================================
-- SUPPORT
-- =====================================================================
create table if not exists contact_queries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  status     text not null default 'new'
             check (status in ('new','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists support_tickets (
  id            uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  customer_id   uuid references customers(id) on delete set null,
  subject       text not null,
  status        text not null default 'open'
                check (status in ('open','pending','resolved','closed')),
  priority      text not null default 'normal'
                check (priority in ('low','normal','high','urgent')),
  assigned_to   uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references support_tickets(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer','staff')),
  sender_id   uuid,
  message     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  is_active  boolean not null default true,
  source     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- REVIEWS
-- =====================================================================
create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  customer_id  uuid references customers(id) on delete set null,
  order_id     uuid references orders(id) on delete set null,
  rating       integer not null check (rating between 1 and 5),
  title        text,
  body         text,
  is_verified  boolean not null default false,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists review_images (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references reviews(id) on delete cascade,
  url        text not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ACCOUNTING
-- =====================================================================
create table if not exists tax_rates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  rate       numeric(5,2) not null default 0 check (rate >= 0),
  region     text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expenses (
  id         uuid primary key default gen_random_uuid(),
  category   text,
  amount     numeric(14,2) not null check (amount >= 0),
  currency   char(3) not null default 'INR',
  note       text,
  spent_at   timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('income','expense')),
  amount      numeric(14,2) not null check (amount >= 0),
  currency    char(3) not null default 'INR',
  reference   text,
  note        text,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table if not exists gst_reports (
  id            uuid primary key default gen_random_uuid(),
  period_start  date not null,
  period_end    date not null,
  total_taxable numeric(14,2) not null default 0,
  total_gst     numeric(14,2) not null default 0,
  report        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  check (period_end >= period_start)
);

-- =====================================================================
-- MEDIA
-- =====================================================================
create table if not exists media_folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  parent_id  uuid references media_folders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_library (
  id         uuid primary key default gen_random_uuid(),
  folder_id  uuid references media_folders(id) on delete set null,
  bucket     text not null,
  path       text not null,
  url        text,
  mime_type  text,
  size_bytes bigint check (size_bytes >= 0),
  alt        text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);

-- =====================================================================
-- SYSTEM
-- =====================================================================
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text,
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references profiles(id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id  uuid,
  action     text not null check (action in ('insert','update','delete')),
  old_data   jsonb,
  new_data   jsonb,
  changed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  value       jsonb not null default '{}'::jsonb,
  description text,
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- Attach updated_at triggers to every table that has the column
-- =====================================================================
do $$
declare
  r record;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
  loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%I;', r.table_name);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', r.table_name);
  end loop;
end $$;
