-- =====================================================================
-- BeyondBabyCo — 044_role_metadata_fallback.sql
-- Allow admin access when profiles.role_id is unset but JWT metadata
-- marks the user as admin (e.g. role=super_admin, is_admin=true).
-- Keeps RLS policies in sync with the Next.js auth layer.
-- =====================================================================

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select r.name
      from profiles p
      join roles r on r.id = p.role_id
      where p.id = auth.uid()
        and p.is_active
      limit 1
    ),
    (
      select case
        when coalesce(
          (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
          (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
          false
        ) then 'admin'
        when auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin' then 'admin'
        when auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin' then 'admin'
        when auth.jwt() -> 'user_metadata' ->> 'role' in ('admin', 'manager', 'support')
          then auth.jwt() -> 'user_metadata' ->> 'role'
        when auth.jwt() -> 'app_metadata' ->> 'role' in ('admin', 'manager', 'support')
          then auth.jwt() -> 'app_metadata' ->> 'role'
        else null
      end
    )
  );
$$;

grant execute on function public.current_user_role() to authenticated;
