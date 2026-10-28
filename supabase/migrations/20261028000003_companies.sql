-- ============================================================
-- Migration: company profiles
-- ============================================================
-- A member can keep several company profiles: name, logo, GST, address,
-- contact, purpose, vision, mission, core values, social links and a brochure.
--
-- Like wheels and tasks, a company belongs to the PERSON. There is no board_id
-- here. A member who changes boards takes their companies with them.
--
-- Who can read one: its owner, and anyone who shares an active board with the
-- owner, as long as the owner has left "is_shared" on. That is the same reach
-- profiles already have (profiles_select), so no new SECURITY DEFINER function
-- and no new cross-member read path is needed: it is plain RLS.
-- Only the owner can write. Superadmin gets no extra reach.
--
-- The company fields that used to sit on `profiles` (company, founded year,
-- industry, about company, website) are copied into a first company below. The
-- old columns are left in place and are no longer read or written by the app.
-- ============================================================

create table companies (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,

  name          text not null check (char_length(btrim(name)) between 1 and 160),
  logo_url      text,
  tagline       text check (tagline is null or char_length(tagline) <= 200),
  industry      text check (industry is null or char_length(industry) <= 120),
  founded_year  integer check (founded_year is null or founded_year between 1800 and 2100),
  about         text check (about is null or char_length(about) <= 4000),
  website       text check (website is null or char_length(website) <= 300),

  gst_number    text check (gst_number is null or char_length(gst_number) = 15),
  address       text check (address is null or char_length(address) <= 500),
  city          text check (city is null or char_length(city) <= 80),
  state         text check (state is null or char_length(state) <= 80),
  pincode       text check (pincode is null or char_length(pincode) <= 12),

  contact_name   text check (contact_name is null or char_length(contact_name) <= 120),
  contact_email  text check (contact_email is null or char_length(contact_email) <= 200),
  contact_phone  text check (contact_phone is null or char_length(contact_phone) <= 40),

  purpose       text check (purpose is null or char_length(purpose) <= 2000),
  vision        text check (vision is null or char_length(vision) <= 2000),
  mission       text check (mission is null or char_length(mission) <= 2000),
  core_values   text[] not null default '{}'
    check (cardinality(core_values) <= 12),

  -- { "linkedin": "https://...", "instagram": "...", ... }; the app owns the keys.
  socials       jsonb not null default '{}'::jsonb
    check (jsonb_typeof(socials) = 'object'),

  -- The brochure file lives in the private company-brochures bucket.
  brochure_path  text,
  brochure_name  text,
  brochure_size  integer check (brochure_size is null or brochure_size >= 0),

  -- Off keeps the company to its owner. On shows it to members of the owner's boards.
  is_shared     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index companies_user_idx on companies (user_id, sort_order, created_at);

create trigger companies_touch
  before update on companies
  for each row execute function touch_updated_at();

alter table companies enable row level security;

create policy companies_select on companies for select
  using (
    user_id = auth.uid()
    or (is_shared and shares_board_with(user_id))
  );

create policy companies_insert on companies for insert
  with check (user_id = auth.uid());

create policy companies_update on companies for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy companies_delete on companies for delete
  using (user_id = auth.uid());

-- ---------- carry over what profiles already held ----------

insert into companies (user_id, name, industry, founded_year, about, website, city)
select p.id,
       btrim(p.company),
       nullif(btrim(p.industry), ''),
       p.company_founded_year,
       nullif(btrim(p.about_company), ''),
       nullif(btrim(p.website), ''),
       nullif(btrim(p.city), '')
from profiles p
where nullif(btrim(p.company), '') is not null;

-- ---------- storage ----------
-- Logos are public to read, like avatars, and written only inside the owner's
-- folder: {user_id}/{company_id}/logo
-- Brochures are private. The owner reads their own; a co-member reads one only
-- when the company row itself is visible to them (so is_shared is respected).
-- Path: {user_id}/{company_id}/brochure

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-logos', 'company-logos', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-brochures', 'company-brochures', false, 10485760,
        array['application/pdf'])
on conflict (id) do nothing;

create policy company_logos_select on storage.objects for select
  using (bucket_id = 'company-logos');

create policy company_logos_insert on storage.objects for insert
  with check (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy company_logos_update on storage.objects for update
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy company_logos_delete on storage.objects for delete
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy company_brochures_select on storage.objects for select
  using (
    bucket_id = 'company-brochures'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from companies c
        where c.id::text = (storage.foldername(name))[2]
          and c.user_id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy company_brochures_insert on storage.objects for insert
  with check (
    bucket_id = 'company-brochures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy company_brochures_update on storage.objects for update
  using (
    bucket_id = 'company-brochures'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'company-brochures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy company_brochures_delete on storage.objects for delete
  using (
    bucket_id = 'company-brochures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
