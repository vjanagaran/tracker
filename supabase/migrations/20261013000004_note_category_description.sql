-- A category can say what belongs in it. Optional, plain text, the owner's
-- own words; it lives on the category row and is private like the rest of it.
alter table note_categories
  add column description text
    check (description is null or char_length(description) <= 500);
