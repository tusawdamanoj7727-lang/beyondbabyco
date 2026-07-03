-- =====================================================================
-- BeyondBabyCo — 006_auth_functions.sql
-- Auth/authorization RPCs used by the Next.js app (Phase 4.3).
-- All SECURITY DEFINER so authenticated users can resolve their own
-- role/permissions and write audit entries without broad table grants.
-- =====================================================================

-- Resolve the signed-in user's role name (or null).
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

-- Resolve the flattened permission codes for the signed-in user.
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

-- Write an audit entry to activity_logs as the signed-in user.
create or replace function public.log_activity(
  p_action    text,
  p_entity    text default null,
  p_entity_id uuid default null,
  p_metadata  jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into activity_logs (actor_id, action, entity, entity_id, metadata)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

grant execute on function public.current_user_role()         to authenticated;
grant execute on function public.current_user_permissions()  to authenticated;
grant execute on function public.log_activity(text, text, uuid, jsonb) to authenticated;
