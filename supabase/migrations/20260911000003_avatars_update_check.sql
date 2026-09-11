-- Upsert of a profile photo needs WITH CHECK on update, not only USING.
-- Without it, replacing an existing avatar can fail even for the owner.

drop policy if exists avatars_update on storage.objects;

create policy avatars_update on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
