-- 0009 · Storage buckets and the default settings row

-- Public buckets: anyone can view images by URL; only admins can change them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('site-assets', 'site-assets', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "Catalog images: public read"
  on storage.objects for select
  using (bucket_id in ('product-images', 'site-assets'));

create policy "Catalog images: admin insert"
  on storage.objects for insert
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin());

create policy "Catalog images: admin update"
  on storage.objects for update
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin())
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin());

create policy "Catalog images: admin delete"
  on storage.objects for delete
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin());

-- The single settings row; content defaults are filled by seed/03_content.sql.
insert into public.store_settings (id) values (1) on conflict (id) do nothing;
