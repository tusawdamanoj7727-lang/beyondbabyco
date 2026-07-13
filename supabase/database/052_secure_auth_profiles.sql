-- =====================================================================
-- 052_secure_auth_profiles.sql
-- Harden authorization: profile-only roles, block self role escalation.
-- =====================================================================

-- Revert current_user_role() to profiles.role_id only (no JWT metadata fallback).
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

grant execute on function public.current_user_role() to authenticated;

-- Block authenticated users from changing privileged profile columns.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    if NEW.role_id is distinct from OLD.role_id then
      raise exception 'profile.role_id is not user-modifiable';
    end if;
    if NEW.is_active is distinct from OLD.is_active then
      raise exception 'profile.is_active is not user-modifiable';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists profiles_protect_privileged_columns on public.profiles;
create trigger profiles_protect_privileged_columns
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

-- On INSERT by non-service callers, force customer role (prevent self-assigning admin).
create or replace function public.enforce_profile_insert_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_role_id uuid;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return NEW;
  end if;

  select id into customer_role_id from roles where name = 'customer' limit 1;
  NEW.role_id := customer_role_id;
  NEW.is_active := true;
  return NEW;
end;
$$;

drop trigger if exists profiles_enforce_insert_role on public.profiles;
create trigger profiles_enforce_insert_role
  before insert on public.profiles
  for each row
  execute function public.enforce_profile_insert_role();
