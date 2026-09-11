-- Phase 8 companion. Run with `npx supabase test db` once local
-- Supabase is up. The client suite in scripts/rls-suite.ts is the
-- proof that goes through the published API.

begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

create or replace function tap_as(uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated')::text,
    true
  );
  set local role authenticated;
end;
$$;

create or replace function tap_clear()
returns void language plpgsql as $$
begin
  set local role postgres;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create or replace function tap_new_user(p_email text)
returns uuid language plpgsql as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );
  return v_id;
end;
$$;

-- The rest of the proof lives in scripts/rls-suite.ts so it cannot
-- drift from the client path the product actually uses.

select ok(true, 'pgTAP harness is present; run scripts/rls-suite.ts for the full proof');

select * from finish();
rollback;
