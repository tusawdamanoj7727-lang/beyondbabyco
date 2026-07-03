-- =====================================================================
-- 021_marketing_automation.sql
-- Phase 4.19 — Enterprise Marketing Automation
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- marketing_templates
-- ---------------------------------------------------------------------
create table if not exists marketing_templates (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  channel         text not null check (channel in ('email','whatsapp','push')),
  subject         text,
  preview_text    text,
  body_html       text,
  body_text       text,
  title           text,
  message         text,
  image_url       text,
  deep_link       text,
  media_url       text,
  buttons         jsonb not null default '[]'::jsonb,
  variables       jsonb not null default '[]'::jsonb,
  status          text not null default 'active' check (status in ('active','archived')),
  deleted_at      timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_marketing_templates_channel on marketing_templates(channel, status);

-- ---------------------------------------------------------------------
-- marketing_segments
-- ---------------------------------------------------------------------
create table if not exists marketing_segments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  segment_type    text not null default 'custom'
                  check (segment_type in ('preset','custom')),
  criteria        jsonb not null default '{}'::jsonb,
  customer_count  integer not null default 0,
  is_active       boolean not null default true,
  deleted_at      timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_marketing_segments_slug on marketing_segments(slug);

-- ---------------------------------------------------------------------
-- marketing_campaigns
-- ---------------------------------------------------------------------
create table if not exists marketing_campaigns (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  campaign_type     text not null check (campaign_type in ('email','whatsapp','push','sms')),
  status            text not null default 'draft'
                    check (status in ('draft','scheduled','running','paused','completed','cancelled')),
  template_id       uuid references marketing_templates(id) on delete set null,
  segment_id        uuid references marketing_segments(id) on delete set null,
  subject           text,
  preview_text      text,
  sender_name       text,
  reply_to          text,
  title             text,
  message           text,
  image_url         text,
  deep_link         text,
  media_url         text,
  buttons           jsonb not null default '[]'::jsonb,
  scheduled_at      timestamptz,
  started_at        timestamptz,
  completed_at      timestamptz,
  sent_count        integer not null default 0,
  delivered_count   integer not null default 0,
  opened_count      integer not null default 0,
  clicked_count     integer not null default 0,
  bounced_count     integer not null default 0,
  conversion_count  integer not null default 0,
  revenue           numeric(14,2) not null default 0,
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_marketing_campaigns_type on marketing_campaigns(campaign_type, status);
create index if not exists idx_marketing_campaigns_scheduled on marketing_campaigns(scheduled_at) where status = 'scheduled';

-- ---------------------------------------------------------------------
-- marketing_automation
-- ---------------------------------------------------------------------
create table if not exists marketing_automation (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  workflow_type   text not null,
  trigger_event   text not null,
  delay_minutes   integer not null default 0 check (delay_minutes >= 0),
  segment_id      uuid references marketing_segments(id) on delete set null,
  action_type     text not null check (action_type in ('email','whatsapp','push','sms')),
  template_id     uuid references marketing_templates(id) on delete set null,
  is_enabled      boolean not null default false,
  last_run_at     timestamptz,
  run_count       integer not null default 0,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_marketing_automation_enabled on marketing_automation(is_enabled) where is_enabled = true;

-- ---------------------------------------------------------------------
-- campaign_recipients
-- ---------------------------------------------------------------------
create table if not exists campaign_recipients (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references marketing_campaigns(id) on delete cascade,
  customer_id     uuid references customers(id) on delete set null,
  email           text,
  phone           text,
  status          text not null default 'pending'
                  check (status in ('pending','queued','sent','delivered','opened','clicked','bounced','failed')),
  sent_at         timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_campaign_recipients_campaign on campaign_recipients(campaign_id, status);

-- ---------------------------------------------------------------------
-- campaign_events
-- ---------------------------------------------------------------------
create table if not exists campaign_events (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references marketing_campaigns(id) on delete cascade,
  recipient_id    uuid references campaign_recipients(id) on delete set null,
  event_type      text not null check (event_type in ('send','deliver','open','click','bounce','conversion')),
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_campaign_events_campaign on campaign_events(campaign_id, created_at desc);

-- ---------------------------------------------------------------------
-- email_queue
-- ---------------------------------------------------------------------
create table if not exists email_queue (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references marketing_campaigns(id) on delete cascade,
  recipient_id    uuid references campaign_recipients(id) on delete cascade,
  to_email        text not null,
  subject         text not null,
  body_html       text,
  body_text       text,
  status          text not null default 'queued'
                  check (status in ('queued','processing','sent','failed')),
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_email_queue_status on email_queue(status, scheduled_at);

-- ---------------------------------------------------------------------
-- whatsapp_queue
-- ---------------------------------------------------------------------
create table if not exists whatsapp_queue (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references marketing_campaigns(id) on delete cascade,
  recipient_id    uuid references campaign_recipients(id) on delete cascade,
  to_phone        text not null,
  template_name   text,
  body            text,
  media_url       text,
  buttons         jsonb not null default '[]'::jsonb,
  status          text not null default 'queued'
                  check (status in ('queued','processing','sent','failed')),
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_whatsapp_queue_status on whatsapp_queue(status, scheduled_at);

-- ---------------------------------------------------------------------
-- push_queue
-- ---------------------------------------------------------------------
create table if not exists push_queue (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references marketing_campaigns(id) on delete cascade,
  recipient_id    uuid references campaign_recipients(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  title           text not null,
  message         text not null,
  image_url       text,
  deep_link       text,
  status          text not null default 'queued'
                  check (status in ('queued','processing','sent','failed')),
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_push_queue_status on push_queue(status, scheduled_at);

-- ---------------------------------------------------------------------
-- Seed preset segments
-- ---------------------------------------------------------------------
insert into marketing_segments (name, slug, description, segment_type, criteria) values
  ('First-time Buyers', 'first-time-buyers', 'Customers with exactly one completed order', 'preset', '{"preset":"first_time_buyers"}'::jsonb),
  ('Returning Customers', 'returning-customers', 'Customers with 2+ orders', 'preset', '{"preset":"returning_customers"}'::jsonb),
  ('VIP Customers', 'vip-customers', 'High-value loyal customers', 'preset', '{"preset":"vip_customers"}'::jsonb),
  ('High LTV', 'high-ltv', 'Top spenders by lifetime value', 'preset', '{"preset":"high_ltv","min_spend":10000}'::jsonb),
  ('Inactive Customers', 'inactive', 'No order in 90+ days', 'preset', '{"preset":"inactive","days":90}'::jsonb),
  ('Abandoned Cart', 'abandoned-cart', 'Cart abandoned in last 7 days', 'preset', '{"preset":"abandoned_cart","days":7}'::jsonb),
  ('Newsletter Subscribers', 'newsletter-subscribers', 'Active newsletter subscribers', 'preset', '{"preset":"newsletter_subscribers"}'::jsonb)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Seed default automation workflows
-- ---------------------------------------------------------------------
insert into marketing_automation (name, slug, description, workflow_type, trigger_event, delay_minutes, action_type, is_enabled) values
  ('Welcome Email', 'welcome-email', 'Send welcome email on signup', 'welcome_email', 'customer.created', 0, 'email', false),
  ('Order Follow-up', 'order-followup', 'Thank you after order delivery', 'order_followup', 'order.delivered', 1440, 'email', false),
  ('Review Request', 'review-request', 'Ask for product review', 'review_request', 'order.delivered', 4320, 'email', false),
  ('Birthday Greeting', 'birthday-greeting', 'Birthday wishes with offer', 'birthday_greeting', 'customer.birthday', 0, 'email', false),
  ('Abandoned Cart Reminder', 'abandoned-cart-reminder', 'Recover abandoned carts', 'abandoned_cart', 'cart.abandoned', 60, 'email', false),
  ('Win-back Campaign', 'win-back', 'Re-engage inactive customers', 'win_back', 'customer.inactive', 0, 'email', false),
  ('Coupon Reminder', 'coupon-reminder', 'Remind about expiring coupons', 'coupon_reminder', 'coupon.expiring', 0, 'email', false),
  ('Loyalty Upgrade', 'loyalty-upgrade', 'Notify tier upgrade', 'loyalty_upgrade', 'loyalty.tier_up', 0, 'email', false),
  ('Newsletter Welcome', 'newsletter-welcome', 'Welcome new subscribers', 'newsletter_welcome', 'newsletter.subscribed', 0, 'email', false)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('marketing.view', 'View marketing dashboard, campaigns, segments and analytics.'),
  ('marketing.send', 'Send, pause and resume marketing campaigns.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code in ('marketing.view', 'marketing.send')
where r.name in ('admin', 'manager')
on conflict do nothing;

-- RLS
do $$
begin
  execute 'drop policy if exists manager_all on public.marketing_templates';
  execute 'create policy manager_all on public.marketing_templates for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.marketing_segments';
  execute 'create policy manager_all on public.marketing_segments for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.marketing_campaigns';
  execute 'create policy manager_all on public.marketing_campaigns for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.marketing_automation';
  execute 'create policy manager_all on public.marketing_automation for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.campaign_recipients';
  execute 'create policy manager_all on public.campaign_recipients for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.campaign_events';
  execute 'create policy manager_all on public.campaign_events for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.email_queue';
  execute 'create policy manager_all on public.email_queue for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.whatsapp_queue';
  execute 'create policy manager_all on public.whatsapp_queue for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.push_queue';
  execute 'create policy manager_all on public.push_queue for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
exception when others then null;
end $$;
