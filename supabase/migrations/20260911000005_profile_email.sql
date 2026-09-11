-- Co-members already read profiles. Email belongs on that shared
-- row so the board list can show how to reach someone, without
-- extending board_velocity or adding another SECURITY DEFINER.

alter table profiles add column email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_wol_id uuid;
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );

  insert into wheels (user_id, type) values (new.id, 'WOL')
  returning id into v_wol_id;

  insert into spokes (wheel_id, name, sort_order, is_predefined)
  select v_wol_id, t.name, t.sort_order, true from wol_spoke_templates t;

  insert into wheels (user_id, type) values (new.id, 'WOB');

  return new;
end;
$$;

create or replace function sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function sync_profile_email();
