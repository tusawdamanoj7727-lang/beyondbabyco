-- =====================================================================
-- BeyondBabyCo — 003_rls.sql
-- Row Level Security: helper functions, enablement, and policies.
-- Roles: admin, manager, support, customer, anonymous.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Role / ownership helper functions (SECURITY DEFINER bypasses RLS to
-- avoid recursive policy evaluation on the profiles table).
-- ---------------------------------------------------------------------
create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    join roles r on r.id = p.role_id
    where p.id = auth.uid()
      and p.is_active
      and r.name = role_name
  );
$$;

create or replace function public.is_admin()   returns boolean
  language sql stable security definer set search_path = public
  as $$ select public.has_role('admin'); $$;

create or replace function public.is_manager() returns boolean
  language sql stable security definer set search_path = public
  as $$ select public.has_role('admin') or public.has_role('manager'); $$;

create or replace function public.is_staff()   returns boolean
  language sql stable security definer set search_path = public
  as $$ select public.has_role('admin')
            or public.has_role('manager')
            or public.has_role('support'); $$;

-- True when the given customers.id belongs to the signed-in user.
create or replace function public.owns_customer(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from customers
    where id = c and profile_id = auth.uid()
  );
$$;

-- =====================================================================
-- Enable RLS on every table in the public schema
-- =====================================================================
do $$
declare r record;
begin
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', r.tablename);
  end loop;
end $$;

-- =====================================================================
-- ADMIN: full access to every table
-- =====================================================================
do $$
declare r record;
begin
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('drop policy if exists admin_all on public.%I;', r.tablename);
    execute format(
      'create policy admin_all on public.%I
         for all to authenticated
         using (public.is_admin()) with check (public.is_admin());',
      r.tablename);
  end loop;
end $$;

-- =====================================================================
-- MANAGER: full access to store-management tables
-- =====================================================================
do $$
declare
  r text;
  manager_tables text[] := array[
    'brands','categories','subcategories','products','product_images',
    'product_variants','product_tags','product_tag_map','ingredients',
    'product_ingredients','benefits','product_benefits','warehouses',
    'suppliers','inventory','stock_movements','purchase_orders',
    'purchase_order_items','shipping_methods','coupons','coupon_usage',
    'gift_cards','gift_card_transactions','loyalty_points','referrals',
    'homepage_settings','homepage_sections','hero_slides','banners',
    'testimonials','blogs','pages','faqs','tax_rates','media_folders',
    'media_library','settings','orders','order_items','payments',
    'shipments','expenses','transactions','gst_reports'
  ];
begin
  foreach r in array manager_tables loop
    execute format('drop policy if exists manager_all on public.%I;', r);
    execute format(
      'create policy manager_all on public.%I
         for all to authenticated
         using (public.is_manager()) with check (public.is_manager());', r);
  end loop;
end $$;

-- =====================================================================
-- SUPPORT (and above): read operational data + manage support desk
-- =====================================================================
do $$
declare
  r text;
  staff_read_tables text[] := array[
    'orders','order_items','shipping_addresses','payments',
    'payment_transactions','shipments','tracking_events','customers',
    'customer_addresses','reviews','review_images','newsletter_subscribers',
    'activity_logs'
  ];
begin
  foreach r in array staff_read_tables loop
    execute format('drop policy if exists staff_read on public.%I;', r);
    execute format(
      'create policy staff_read on public.%I
         for select to authenticated using (public.is_staff());', r);
  end loop;
end $$;

-- Support staff fully manage the support desk
do $$
declare
  r text;
  support_manage text[] := array[
    'support_tickets','ticket_messages','contact_queries'
  ];
begin
  foreach r in array support_manage loop
    execute format('drop policy if exists support_manage on public.%I;', r);
    execute format(
      'create policy support_manage on public.%I
         for all to authenticated
         using (public.is_staff()) with check (public.is_staff());', r);
  end loop;
end $$;

-- =====================================================================
-- PUBLIC (anonymous + authenticated): read published catalog & CMS
-- =====================================================================

-- Catalog
create policy public_read_products on products
  for select to anon, authenticated
  using (status in ('active','coming_soon'));

create policy public_read_brands on brands
  for select to anon, authenticated using (is_active);

create policy public_read_categories on categories
  for select to anon, authenticated using (is_active);

create policy public_read_subcategories on subcategories
  for select to anon, authenticated using (is_active);

create policy public_read_product_images on product_images
  for select to anon, authenticated using (true);

create policy public_read_product_variants on product_variants
  for select to anon, authenticated using (is_active);

create policy public_read_product_tags on product_tags
  for select to anon, authenticated using (true);

create policy public_read_product_tag_map on product_tag_map
  for select to anon, authenticated using (true);

create policy public_read_ingredients on ingredients
  for select to anon, authenticated using (true);

create policy public_read_product_ingredients on product_ingredients
  for select to anon, authenticated using (true);

create policy public_read_benefits on benefits
  for select to anon, authenticated using (true);

create policy public_read_product_benefits on product_benefits
  for select to anon, authenticated using (true);

-- CMS
create policy public_read_homepage_settings on homepage_settings
  for select to anon, authenticated using (true);

create policy public_read_homepage_sections on homepage_sections
  for select to anon, authenticated using (is_enabled);

create policy public_read_hero_slides on hero_slides
  for select to anon, authenticated using (is_active);

create policy public_read_banners on banners
  for select to anon, authenticated using (is_active);

create policy public_read_testimonials on testimonials
  for select to anon, authenticated using (is_published);

create policy public_read_blogs on blogs
  for select to anon, authenticated using (status = 'published');

create policy public_read_pages on pages
  for select to anon, authenticated using (status = 'published');

create policy public_read_faqs on faqs
  for select to anon, authenticated using (is_published);

create policy public_read_shipping_methods on shipping_methods
  for select to anon, authenticated using (is_active);

create policy public_read_reviews on reviews
  for select to anon, authenticated using (is_published);

create policy public_read_review_images on review_images
  for select to anon, authenticated using (true);

-- =====================================================================
-- PUBLIC writes: lead capture
-- =====================================================================
create policy public_insert_newsletter on newsletter_subscribers
  for insert to anon, authenticated with check (true);

create policy public_insert_contact on contact_queries
  for insert to anon, authenticated with check (true);

-- =====================================================================
-- CUSTOMER: self-service ownership
-- =====================================================================
create policy customer_self_select on customers
  for select to authenticated using (profile_id = auth.uid());
create policy customer_self_update on customers
  for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy profile_self_select on profiles
  for select to authenticated using (id = auth.uid());
create policy profile_self_update on profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy address_owner_all on customer_addresses
  for all to authenticated
  using (public.owns_customer(customer_id))
  with check (public.owns_customer(customer_id));

create policy wishlist_owner_all on wishlist
  for all to authenticated
  using (public.owns_customer(customer_id))
  with check (public.owns_customer(customer_id));

create policy cart_owner_all on cart
  for all to authenticated
  using (public.owns_customer(customer_id))
  with check (public.owns_customer(customer_id));

create policy cart_items_owner_all on cart_items
  for all to authenticated
  using (exists (
    select 1 from cart c
    where c.id = cart_items.cart_id and public.owns_customer(c.customer_id)))
  with check (exists (
    select 1 from cart c
    where c.id = cart_items.cart_id and public.owns_customer(c.customer_id)));

create policy orders_owner_select on orders
  for select to authenticated using (public.owns_customer(customer_id));

create policy order_items_owner_select on order_items
  for select to authenticated
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id and public.owns_customer(o.customer_id)));

create policy reviews_owner_write on reviews
  for all to authenticated
  using (public.owns_customer(customer_id))
  with check (public.owns_customer(customer_id));

create policy notifications_owner on notifications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy tickets_owner_select on support_tickets
  for select to authenticated using (public.owns_customer(customer_id));
create policy tickets_owner_insert on support_tickets
  for insert to authenticated with check (public.owns_customer(customer_id));

create policy ticket_messages_owner on ticket_messages
  for select to authenticated
  using (exists (
    select 1 from support_tickets t
    where t.id = ticket_messages.ticket_id
      and public.owns_customer(t.customer_id)));
