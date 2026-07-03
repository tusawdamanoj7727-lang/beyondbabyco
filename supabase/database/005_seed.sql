-- =====================================================================
-- BeyondBabyCo — 005_seed.sql
-- Baseline data: roles, permissions, default categories, settings.
-- Idempotent (safe to re-run).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
insert into roles (name, description, is_system) values
  ('admin',    'Full system access across all modules.',          true),
  ('manager',  'Manages catalog, inventory, orders and content.',  true),
  ('support',  'Handles customer support and order assistance.',   true),
  ('customer', 'Standard shopper account.',                        true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Permissions (coarse-grained capability codes)
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('catalog.manage',   'Create and edit products, categories, brands.'),
  ('inventory.manage', 'Manage warehouses, stock and purchase orders.'),
  ('orders.manage',    'View and update orders, payments, shipments.'),
  ('orders.view',      'Read-only access to orders.'),
  ('customers.view',   'View customer records.'),
  ('content.manage',   'Manage CMS: homepage, blogs, banners, pages.'),
  ('support.manage',   'Manage tickets and contact queries.'),
  ('marketing.manage', 'Manage coupons, gift cards, loyalty, referrals.'),
  ('accounting.manage','Manage expenses, transactions and GST reports.'),
  ('settings.manage',  'Manage global system settings.')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- Role → permission mappings
-- ---------------------------------------------------------------------
-- admin: everything
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r cross join permissions p
where r.name = 'admin'
on conflict do nothing;

-- manager: store operations + content + marketing
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code in (
  'catalog.manage','inventory.manage','orders.manage','orders.view',
  'customers.view','content.manage','marketing.manage','accounting.manage'
)
where r.name = 'manager'
on conflict do nothing;

-- support: order visibility + support desk
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code in (
  'orders.view','customers.view','support.manage'
)
where r.name = 'support'
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Default categories
-- ---------------------------------------------------------------------
insert into categories (name, slug, description, position, is_active) values
  ('Baby Wipes',  'baby-wipes',  'Gentle, soft baby wipes.',        1, true),
  ('Baby Wash',   'baby-wash',   'Soap-free cleansing for babies.', 2, true),
  ('Baby Lotion', 'baby-lotion', 'Daily hydration for baby skin.',  3, true),
  ('Baby Powder', 'baby-powder', 'Soothing, talc-free baby powder.',4, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Baseline settings
-- ---------------------------------------------------------------------
insert into settings (key, value, description) values
  ('store',    '{"name":"BeyondBabyCo","currency":"INR","country":"IN"}'::jsonb,
               'Core store configuration.'),
  ('contact',  '{"email":"beyondbabyco@gmail.com","city":"Udaipur","state":"Rajasthan"}'::jsonb,
               'Public contact information.'),
  ('company',  '{"legal_name":"Tusawda Global Private Limited"}'::jsonb,
               'Parent company details.')
on conflict (key) do nothing;
