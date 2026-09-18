-- Personal documents. Owned by the person, never the board. No task_id,
-- spoke_id or board_id — task notes stay on tasks; this store is separate.
-- Inline images and attached files share one private bucket; paths are
-- {user_id}/{note_id}/{file_id} so storage RLS can key off the owner folder.

create type note_file_kind as enum ('inline', 'attachment');

create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null default '',
  body        jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  body_text   text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index notes_user_updated_idx on notes (user_id, updated_at desc);

create table note_files (
  id             uuid primary key,
  note_id        uuid not null references notes(id) on delete cascade,
  kind           note_file_kind not null,
  original_name  text not null,
  mime_type      text not null,
  size_bytes     integer not null check (size_bytes >= 0),
  storage_path   text not null unique,
  created_at     timestamptz not null default now()
);

create index note_files_note_idx on note_files (note_id, kind, created_at);

create trigger notes_touch
  before update on notes
  for each row execute function touch_updated_at();

create or replace function owns_note(p_note_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from notes where id = p_note_id and user_id = auth.uid());
$$;

alter table notes      enable row level security;
alter table note_files enable row level security;

create policy notes_own on notes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy note_files_own on note_files for all
  using (owns_note(note_id)) with check (owns_note(note_id));

insert into storage.buckets (id, name, public, file_size_limit)
values ('notes', 'notes', false, 20971520)
on conflict (id) do nothing;

create policy notes_objects_select on storage.objects for select
  using (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy notes_objects_insert on storage.objects for insert
  with check (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy notes_objects_update on storage.objects for update
  using (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy notes_objects_delete on storage.objects for delete
  using (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
