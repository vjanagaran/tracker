-- Opt-in morning note. Off by default. Timezone is the member's clock,
-- so 07:00 is theirs, not the server's. sent_on is their local date —
-- the cron may run twice in the same hour and must not mail twice.

alter table profiles
  add column timezone text,
  add column morning_note_on boolean not null default false,
  add column morning_note_sent_on date;

comment on column profiles.morning_note_on is
  'Opt-in mail at 07:00 local when the day has work. Never a spoke nudge.';
comment on column profiles.timezone is
  'IANA zone. Required when morning_note_on is true.';
