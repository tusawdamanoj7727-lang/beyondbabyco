-- =====================================================================
-- 014_reviews_moderation.sql
-- Phase 4.12 — Enterprise Reviews & Moderation
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- reviews — moderation fields
-- ---------------------------------------------------------------------
alter table reviews
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending','approved','rejected','hidden','spam')),
  add column if not exists pros              text,
  add column if not exists cons              text,
  add column if not exists is_featured       boolean not null default false,
  add column if not exists internal_notes    text,
  add column if not exists moderator_id      uuid references profiles(id) on delete set null,
  add column if not exists moderation_reason text,
  add column if not exists edited_at         timestamptz,
  add column if not exists deleted_at        timestamptz;

-- Backfill from legacy is_published
update reviews
set moderation_status = case when is_published then 'approved' else 'pending' end
where moderation_status = 'pending' and is_published = true;

create index if not exists idx_reviews_moderation   on reviews(moderation_status);
create index if not exists idx_reviews_featured     on reviews(is_featured) where is_featured = true;
create index if not exists idx_reviews_rating       on reviews(rating);
create index if not exists idx_reviews_created      on reviews(created_at desc);
create index if not exists idx_reviews_deleted      on reviews(deleted_at) where deleted_at is not null;

-- ---------------------------------------------------------------------
-- review_events — moderation history timeline
-- ---------------------------------------------------------------------
create table if not exists review_events (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references reviews(id) on delete cascade,
  type       text not null,
  message    text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_events_review on review_events(review_id, created_at desc);

-- ---------------------------------------------------------------------
-- Permission: reviews.manage
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('reviews.manage', 'Moderate product reviews and featured ratings.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = 'reviews.manage'
where r.name in ('admin', 'manager')
on conflict do nothing;

-- RLS for review_events
do $$
begin
  execute 'drop policy if exists manager_all on public.review_events';
  execute 'create policy manager_all on public.review_events for all to authenticated using (public.is_manager()) with check (public.is_manager())';
exception when others then null;
end $$;
