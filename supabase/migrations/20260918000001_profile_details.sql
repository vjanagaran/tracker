-- Broader profile, still the only shared personal surface.
-- Co-members already read profiles via shares_board_with.

alter table profiles
  add column designation text,
  add column company text,
  add column company_founded_year integer
    check (
      company_founded_year is null
      or (company_founded_year between 1800 and 2100)
    ),
  add column industry text,
  add column city text,
  add column about text,
  add column about_company text,
  add column website text,
  add column linkedin text;
