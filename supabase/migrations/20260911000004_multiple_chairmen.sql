-- A board can have more than one active chairman, the same way a
-- WhatsApp group can have more than one admin. Each of them can
-- keep the meeting calendar. The app still refuses to leave a
-- board with none.

drop index if exists board_one_chairman_idx;
