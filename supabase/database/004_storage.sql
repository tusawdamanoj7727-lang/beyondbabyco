-- =====================================================================
-- BeyondBabyCo — 004_storage.sql
-- Storage buckets and access policies.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Buckets
--   products, homepage, mascots, blog  -> public read
--   media, documents                   -> private (staff only)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('products',  'products',  true),
  ('homepage',  'homepage',  true),
  ('mascots',   'mascots',   true),
  ('blog',      'blog',      true),
  ('media',     'media',     false),
  ('documents', 'documents', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Public buckets: anyone can read; only managers/admins can write.
-- ---------------------------------------------------------------------
do $$
declare
  b text;
  public_buckets text[] := array['products','homepage','mascots','blog'];
begin
  foreach b in array public_buckets loop
    execute format($f$
      drop policy if exists "public_read_%1$s" on storage.objects;
      create policy "public_read_%1$s" on storage.objects
        for select to anon, authenticated
        using (bucket_id = %1$L);
    $f$, b);

    execute format($f$
      drop policy if exists "manager_write_%1$s" on storage.objects;
      create policy "manager_write_%1$s" on storage.objects
        for all to authenticated
        using (bucket_id = %1$L and public.is_manager())
        with check (bucket_id = %1$L and public.is_manager());
    $f$, b);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Private buckets: staff read, manager write.
-- ---------------------------------------------------------------------
do $$
declare
  b text;
  private_buckets text[] := array['media','documents'];
begin
  foreach b in array private_buckets loop
    execute format($f$
      drop policy if exists "staff_read_%1$s" on storage.objects;
      create policy "staff_read_%1$s" on storage.objects
        for select to authenticated
        using (bucket_id = %1$L and public.is_staff());
    $f$, b);

    execute format($f$
      drop policy if exists "manager_write_%1$s" on storage.objects;
      create policy "manager_write_%1$s" on storage.objects
        for all to authenticated
        using (bucket_id = %1$L and public.is_manager())
        with check (bucket_id = %1$L and public.is_manager());
    $f$, b);
  end loop;
end $$;
