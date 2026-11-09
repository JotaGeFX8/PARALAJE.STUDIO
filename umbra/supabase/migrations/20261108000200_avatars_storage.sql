-- =============================================================================
-- UMBRA · Migración 0002 · Almacenamiento de avatares
-- =============================================================================
-- Bucket público de lectura (las URLs son impredecibles: <uid>/<timestamp>.ext),
-- escritura limitada a la carpeta propia de cada usuario.
-- Límite: 2 MB y solo JPEG, PNG o WebP (el plan gratuito incluye 1 GB).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars: subir a carpeta propia"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_active_member()
);

create policy "avatars: actualizar en carpeta propia"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_active_member()
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatars: borrar en carpeta propia"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Listar la carpeta propia (necesario para limpiar avatares antiguos).
create policy "avatars: listar carpeta propia"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
