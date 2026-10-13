-- Note categories: a per-person tree, ordered by hand. Owned by the person,
-- never the board. Notes point at a category; deleting a category leaves its
-- notes uncategorised. A category with subcategories cannot be deleted.
--
-- Note comments: append-only, specific to one note. Same shape as task_notes,
-- named comments so they are not confused with the notes themselves.

-- ---------- categories ----------

create table note_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references note_categories(id),
  name        text not null
              check (char_length(name) between 1 and 60 and name = btrim(name)),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index note_categories_name_idx
  on note_categories (
    user_id,
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(name)
  );

create index note_categories_tree_idx
  on note_categories (user_id, parent_id, sort_order);

create trigger note_categories_touch
  before update on note_categories
  for each row execute function touch_updated_at();

create or replace function owns_note_category(p_category_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from note_categories
    where id = p_category_id and user_id = auth.uid()
  );
$$;

create or replace function note_categories_guard()
returns trigger language plpgsql as $$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A category cannot sit inside itself.';
  end if;

  if exists (
    with recursive ancestors as (
      select id, parent_id from note_categories where id = new.parent_id
      union
      select c.id, c.parent_id
      from note_categories c
      join ancestors a on c.id = a.parent_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'A category cannot sit inside one of its own subcategories.';
  end if;

  return new;
end;
$$;

create trigger note_categories_no_cycle
  before insert or update of parent_id on note_categories
  for each row execute function note_categories_guard();

alter table note_categories enable row level security;

create policy note_categories_own on note_categories for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (parent_id is null or owns_note_category(parent_id))
  );

-- ---------- notes point at a category ----------

alter table notes
  add column category_id uuid references note_categories(id) on delete set null;

create index notes_user_category_idx on notes (user_id, category_id);

-- Bring over any text categories from the earlier column, one top-level
-- category per distinct name per person.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notes' and column_name = 'category'
  ) then
    insert into note_categories (user_id, name, sort_order)
    select
      user_id,
      name,
      (row_number() over (partition by user_id order by lower(name)) - 1)::integer
    from (
      select user_id, min(category) as name
      from notes
      where category is not null
      group by user_id, lower(category)
    ) distinct_names;

    update notes n
    set category_id = c.id
    from note_categories c
    where n.category is not null
      and c.user_id = n.user_id
      and c.parent_id is null
      and lower(c.name) = lower(n.category);

    alter table notes drop constraint if exists notes_category_check;
    alter table notes drop column category;
  end if;
end;
$$;

drop policy notes_own on notes;

create policy notes_own on notes for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (category_id is null or owns_note_category(category_id))
  );

-- ---------- comments ----------

create table note_comments (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references notes(id) on delete cascade,
  comment     text not null check (char_length(btrim(comment)) > 0),
  created_at  timestamptz not null default now()
);

create index note_comments_note_idx on note_comments (note_id, created_at);

alter table note_comments enable row level security;

create policy note_comments_own on note_comments for all
  using (owns_note(note_id)) with check (owns_note(note_id));
