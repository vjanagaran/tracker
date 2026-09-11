-- Meetings get a separate agenda field: topics planned ahead of the
-- meeting, distinct from notes (kept for what happened afterward).
-- Same table, so the existing meetings_select / meetings_write RLS
-- policies (board member reads, chairman-or-superadmin writes) cover
-- it with no new policy needed.

alter table meetings add column agenda text;
