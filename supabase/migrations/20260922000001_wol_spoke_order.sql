-- Giving back sits 7th; Spiritual pursuits is last.
-- Existing life wheels keep their scores and plans; only display order changes.

update wol_spoke_templates
set sort_order = case name
  when 'Giving back' then 7
  when 'Spiritual pursuits' then 8
  else sort_order
end
where name in ('Giving back', 'Spiritual pursuits');

update spokes s
set sort_order = t.sort_order
from wheels w,
     wol_spoke_templates t
where s.wheel_id = w.id
  and w.type = 'WOL'
  and s.is_predefined
  and s.name = t.name
  and t.name in ('Giving back', 'Spiritual pursuits');
