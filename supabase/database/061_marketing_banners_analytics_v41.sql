-- =====================================================================
-- 061_marketing_banners_analytics_v41.sql
-- Banner Manager enrichment + marketing event analytics.
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Banners — enterprise fields
-- ---------------------------------------------------------------------
alter table banners
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists alt_text text,
  add column if not exists aria_label text,
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video', 'gif')),
  add column if not exists video_url text,
  add column if not exists campaign_id uuid references marketing_campaigns(id) on delete set null,
  add column if not exists priority integer not null default 50,
  add column if not exists deleted_at timestamptz;

-- Backfill: active banners become published
update banners
set status = 'published'
where is_active = true and status = 'draft';

create index if not exists idx_banners_status_priority
  on banners (status, priority desc, position)
  where deleted_at is null;

create index if not exists idx_banners_schedule_v41
  on banners (starts_at, ends_at)
  where deleted_at is null and status = 'published';

-- ---------------------------------------------------------------------
-- Marketing events — views / clicks / conversions attribution
-- ---------------------------------------------------------------------
create table if not exists marketing_events (
  id           uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('campaign', 'banner', 'announcement')),
  subject_id   text not null,
  event_type   text not null check (event_type in (
    'view', 'unique_view', 'click', 'coupon_use', 'order', 'revenue'
  )),
  session_id   text,
  value        numeric(12,2) not null default 0,
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_marketing_events_subject
  on marketing_events (subject_type, subject_id, event_type, created_at desc);

create index if not exists idx_marketing_events_created
  on marketing_events (created_at desc);

alter table marketing_events enable row level security;

drop policy if exists marketing_events_service_all on marketing_events;
-- Service role bypasses RLS; managers read via service client in admin.
-- Allow authenticated staff with marketing to insert/select if policies exist.
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'marketing_events' and policyname = 'marketing_events_insert_public'
  ) then
    create policy marketing_events_insert_public on marketing_events
      for insert to anon, authenticated
      with check (true);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Announcement rotation settings (homepage_settings)
-- ---------------------------------------------------------------------
insert into homepage_settings (key, value) values
  (
    'announcement_rotation',
    jsonb_build_object(
      'enabled', true,
      'speedMs', 40000,
      'pauseOnHover', true,
      'autoPlay', true,
      'maxVisible', 1,
      'mobileSwipe', true
    )
  )
on conflict (key) do nothing;
