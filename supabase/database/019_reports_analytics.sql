-- =====================================================================
-- 019_reports_analytics.sql
-- Phase 4.17 — Enterprise Reports & Analytics
-- Additive + idempotent. Uses existing operational tables for data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- saved_reports — user-saved filter/widget/layout presets
-- ---------------------------------------------------------------------
create table if not exists saved_reports (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  report_type   text not null,
  filters       jsonb not null default '{}'::jsonb,
  widget_config jsonb not null default '{}'::jsonb,
  layout        jsonb not null default '[]'::jsonb,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_saved_reports_user on saved_reports(created_by, updated_at desc);

-- ---------------------------------------------------------------------
-- scheduled_reports — automated report delivery
-- ---------------------------------------------------------------------
create table if not exists scheduled_reports (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  report_type   text not null,
  frequency     text not null
                check (frequency in ('daily','weekly','monthly','quarterly','yearly')),
  email         text not null,
  filters       jsonb not null default '{}'::jsonb,
  format        text not null default 'csv'
                check (format in ('csv','excel','pdf')),
  is_enabled    boolean not null default true,
  last_run_at   timestamptz,
  next_run_at   timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_scheduled_reports_enabled on scheduled_reports(is_enabled) where is_enabled = true;

-- ---------------------------------------------------------------------
-- report_exports — export job history
-- ---------------------------------------------------------------------
create table if not exists report_exports (
  id            uuid primary key default gen_random_uuid(),
  report_type   text not null,
  format        text not null check (format in ('csv','excel','pdf','print')),
  status        text not null default 'completed'
                check (status in ('pending','completed','failed')),
  row_count     integer not null default 0,
  file_name     text,
  filters       jsonb not null default '{}'::jsonb,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_report_exports_user on report_exports(created_by, created_at desc);

-- ---------------------------------------------------------------------
-- analytics_snapshots — pre-aggregated metric cache
-- ---------------------------------------------------------------------
create table if not exists analytics_snapshots (
  id             uuid primary key default gen_random_uuid(),
  snapshot_date  date not null default current_date,
  metric_key     text not null,
  metric_value   numeric(18,4) not null default 0,
  dimensions     jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  unique (snapshot_date, metric_key, dimensions)
);

create index if not exists idx_analytics_snapshots_key on analytics_snapshots(metric_key, snapshot_date desc);

-- ---------------------------------------------------------------------
-- dashboard_widgets — per-user widget visibility & order
-- ---------------------------------------------------------------------
create table if not exists dashboard_widgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  widget_key  text not null,
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  config      jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  unique (user_id, widget_key)
);

create index if not exists idx_dashboard_widgets_user on dashboard_widgets(user_id, sort_order);

-- ---------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('reports.view', 'View reports and analytics dashboards.'),
  ('reports.export', 'Export reports to CSV, Excel and PDF.'),
  ('analytics.manage', 'Manage saved dashboards, scheduled reports and widget layouts.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code in ('reports.view', 'reports.export', 'analytics.manage')
where r.name in ('admin', 'manager')
on conflict do nothing;

-- RLS
do $$
begin
  execute 'drop policy if exists manager_all on public.saved_reports';
  execute 'create policy manager_all on public.saved_reports for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.scheduled_reports';
  execute 'create policy manager_all on public.scheduled_reports for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.report_exports';
  execute 'create policy manager_all on public.report_exports for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.analytics_snapshots';
  execute 'create policy manager_all on public.analytics_snapshots for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.dashboard_widgets';
  execute 'create policy manager_all on public.dashboard_widgets for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
exception when others then null;
end $$;
