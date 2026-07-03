-- =====================================================================
-- BeyondBabyCo — 022_admin_bootstrap.sql
-- Idempotent seed: roles, permissions, admin role mappings, auth RPCs.
-- Safe to re-run — never duplicates roles or permission mappings.
--
-- Supabase Cloud: auth users are NOT created in SQL.
-- After running this migration, create the admin account via:
--   npm run bootstrap:admin
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Ensure core roles exist
-- ---------------------------------------------------------------------
insert into public.roles (name, description, is_system) values
  ('admin',    'Full system access across all modules.',         true),
  ('manager',  'Manages catalog, inventory, orders and content.', true),
  ('support',  'Handles customer support and order assistance.',  true),
  ('customer', 'Standard shopper account.',                       true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 2. Ensure every permission used by the app exists
--    (mirrors src/lib/auth/permissions.ts + module migrations)
-- ---------------------------------------------------------------------
insert into public.permissions (code, description) values
  ('catalog.manage',    'Create and edit products, categories, brands.'),
  ('inventory.manage',  'Manage warehouses, stock and purchase orders.'),
  ('orders.manage',     'View and update orders, payments, shipments.'),
  ('orders.view',       'Read-only access to orders.'),
  ('customers.view',    'View customer records.'),
  ('customers.manage',  'Create, edit, merge and manage customer records.'),
  ('content.manage',    'Manage CMS: homepage, blogs, banners, pages.'),
  ('cms.manage',        'Manage the homepage CMS, hero slides and testimonials.'),
  ('media.manage',      'Manage the media library and storage assets.'),
  ('reviews.manage',    'Moderate product reviews and featured ratings.'),
  ('returns.manage',    'Manage returns, RMA workflow, inspections and refunds.'),
  ('support.manage',    'Manage tickets and contact queries.'),
  ('marketing.manage',  'Manage coupons, gift cards, loyalty, referrals and campaigns.'),
  ('marketing.view',    'View marketing dashboard, campaigns, segments and analytics.'),
  ('marketing.send',    'Send, pause and resume marketing campaigns.'),
  ('shipping.manage',   'Manage carriers, zones, rates, shipments, pickups and NDR.'),
  ('payments.manage',   'Manage payment gateways, transactions, settlements and reconciliation.'),
  ('reports.view',      'View reports and analytics dashboards.'),
  ('reports.export',    'Export reports to CSV, Excel and PDF.'),
  ('analytics.manage',  'Manage saved dashboards, scheduled reports and widget layouts.'),
  ('finance.view',      'View accounting dashboard, ledger and GST reports.'),
  ('finance.manage',    'Manage expenses, vendors, journal entries and reconciliation.'),
  ('finance.export',    'Export financial reports and GST data.'),
  ('accounting.manage', 'Manage expenses, transactions and GST reports.'),
  ('settings.manage',   'Manage global system settings.')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 3. Admin role receives every permission
-- ---------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'admin'
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 4. Auth RPCs used by the admin app (repair if 006 was skipped)
-- ---------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from profiles p
  join roles r on r.id = p.role_id
  where p.id = auth.uid()
    and p.is_active
  limit 1;
$$;

create or replace function public.current_user_permissions()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct perm.code
  from profiles p
  join role_permissions rp on rp.role_id = p.role_id
  join permissions perm on perm.id = rp.permission_id
  where p.id = auth.uid()
    and p.is_active;
$$;

grant execute on function public.current_user_role()        to authenticated;
grant execute on function public.current_user_permissions() to authenticated;
