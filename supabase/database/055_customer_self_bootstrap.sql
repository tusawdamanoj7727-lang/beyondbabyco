-- =====================================================================
-- 055_customer_self_bootstrap.sql
-- Let authenticated users bootstrap profile + customer without service role.
-- Safe to re-run.
-- =====================================================================

create or replace function public.ensure_customer_account(p_full_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_customer_role_id uuid;
  v_profile profiles%rowtype;
  v_customer_id uuid;
begin
  if v_uid is null then
    return null;
  end if;

  select email into v_email from auth.users where id = v_uid;

  v_full_name := nullif(trim(coalesce(p_full_name, '')), '');
  if v_full_name is null then
    select nullif(trim(full_name), '') into v_full_name from profiles where id = v_uid;
  end if;
  if v_full_name is null then
    v_full_name := coalesce(nullif(split_part(coalesce(v_email, ''), '@', 1), ''), 'Customer');
  end if;

  select id into v_customer_role_id from roles where name = 'customer' limit 1;

  select * into v_profile from profiles where id = v_uid;

  if not found then
    insert into profiles (id, role_id, full_name, is_active)
    values (v_uid, v_customer_role_id, v_full_name, true);
  elsif not public.is_staff() then
    update profiles
    set full_name = v_full_name,
        updated_at = now()
    where id = v_uid;
  else
    update profiles
    set full_name = v_full_name,
        updated_at = now()
    where id = v_uid;
  end if;

  select id into v_customer_id
  from customers
  where profile_id = v_uid
  limit 1;

  if v_customer_id is null then
    insert into customers (profile_id, email, full_name)
    values (v_uid, v_email, v_full_name)
    returning id into v_customer_id;
  end if;

  return v_customer_id;
end;
$$;

grant execute on function public.ensure_customer_account(text) to authenticated;
