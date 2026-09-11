-- Profile photos move from a pasted URL to an uploaded file. Storage is
-- part of this same Supabase project, so it already lives in Mumbai
-- alongside the database — there is no separate per-bucket region to
-- choose. One object per person at a fixed path, so re-uploading a
-- photo overwrites it in place instead of leaving old files behind.
--
-- Public read matches what the profile screen already promises ("photo
-- ... is what people on your board can see") and what the pasted-URL
-- field already allowed. Writes are restricted to the uploader's own
-- folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy avatars_select on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_insert on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_update on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_delete on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
