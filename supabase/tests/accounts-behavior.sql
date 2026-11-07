-- Behavioral test for sign-up, guest conversion and profile saving.
-- Run on a disposable Supabase database after 20261107213000 as a superuser.
-- Everything rolls back. Do not run against production.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(19);

CREATE SCHEMA test_helpers;

CREATE FUNCTION test_helpers.act_as(target_role text, target_user uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', coalesce(target_user::text, ''), true);
  PERFORM set_config('request.jwt.claim.role', target_role, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', target_user, 'role', target_role)::text,
    true
  );
  EXECUTE format('SET LOCAL ROLE %I', target_role);
END;
$$;

CREATE FUNCTION test_helpers.act_as_system() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', '', true);
  PERFORM set_config('request.jwt.claims', '', true);
END;
$$;

GRANT USAGE ON SCHEMA test_helpers TO authenticated, anon;

-- Sign-up
INSERT INTO auth.users (id, email, raw_user_meta_data, is_anonymous) VALUES
  ('00000000-0000-0000-0000-00000000a001', 'owner@example.invalid', '{"full_name": "Owner Name"}', false),
  ('00000000-0000-0000-0000-00000000a002', 'oauth@example.invalid', '{"name": "OAuth Name"}', false),
  ('00000000-0000-0000-0000-00000000a003', 'plain@example.invalid', '{}', false),
  ('00000000-0000-0000-0000-00000000a004', NULL, '{}', true);

SELECT is((SELECT full_name FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-00000000a001'), 'Owner Name', 'email sign-up gets a profile');
SELECT is((SELECT full_name FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-00000000a002'), 'OAuth Name', 'OAuth sign-up uses the provider name');
SELECT is((SELECT full_name FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-00000000a003'), 'plain', 'sign-up with no name falls back to the email');
SELECT is((SELECT count(*)::int FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-00000000a004'), 0, 'guests do not get a profile');

-- Guest conversion, and email sync with no JWT, as Auth runs them
UPDATE auth.users SET email = 'converted@example.invalid', is_anonymous = false WHERE id = '00000000-0000-0000-0000-00000000a004';
SELECT is((SELECT email FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-00000000a004'), 'converted@example.invalid', 'a converted guest gets a profile');

UPDATE auth.users SET email = 'renamed@example.invalid' WHERE id = '00000000-0000-0000-0000-00000000a003';
SELECT is((SELECT email FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-00000000a003'), 'renamed@example.invalid', 'email changes reach the profile');

UPDATE public.user_profiles SET email = 'stale@example.invalid' WHERE id = '00000000-0000-0000-0000-00000000a002';
SELECT lives_ok(
  $$UPDATE auth.users SET email = 'stale@example.invalid' WHERE id = '00000000-0000-0000-0000-00000000a003'$$,
  'a stale profile email cannot block an auth update'
);

-- Saving your own profile
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-00000000a001');
SELECT lives_ok(
  $$UPDATE public.user_profiles SET full_name = 'New Name' WHERE id = '00000000-0000-0000-0000-00000000a001'$$,
  'owner can save their profile'
);
SELECT is((SELECT full_name FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-00000000a001'), 'New Name', 'the save persisted');

SELECT throws_ok($$UPDATE public.user_profiles SET tier = 'enterprise' WHERE id = '00000000-0000-0000-0000-00000000a001'$$, 'protected profile fields cannot be changed', 'owner cannot change their tier');
SELECT throws_ok($$UPDATE public.user_profiles SET is_admin = true WHERE id = '00000000-0000-0000-0000-00000000a001'$$, 'protected profile fields cannot be changed', 'owner cannot make themselves admin');
SELECT throws_ok($$UPDATE public.user_profiles SET email = 'x@example.invalid' WHERE id = '00000000-0000-0000-0000-00000000a001'$$, 'protected profile fields cannot be changed', 'owner cannot rewrite their profile email');
SELECT throws_ok($$UPDATE public.user_profiles SET audit_count = 99 WHERE id = '00000000-0000-0000-0000-00000000a001'$$, 'protected profile fields cannot be changed', 'owner cannot reset their usage count');

-- Other people's profiles
SELECT is((SELECT count(*)::int FROM public.user_profiles), 1, 'a user sees only their own profile');
SELECT lives_ok($$UPDATE public.user_profiles SET full_name = 'Hijacked' WHERE id = '00000000-0000-0000-0000-00000000a002'$$, 'updating another profile runs');
SELECT test_helpers.act_as_system();
SELECT is((SELECT full_name FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-00000000a002'), 'OAuth Name', 'and changes nothing');

SELECT test_helpers.act_as('anon', NULL);
SELECT is((SELECT count(*)::int FROM public.user_profiles), 0, 'signed-out visitors see no profiles');
SELECT test_helpers.act_as_system();

-- Admins
UPDATE public.user_profiles SET is_admin = true WHERE id = '00000000-0000-0000-0000-00000000a002';
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-00000000a002');
SELECT is((SELECT count(*)::int FROM public.user_profiles), 4, 'an active admin sees every profile');
SELECT lives_ok($$UPDATE public.user_profiles SET tier = 'pro' WHERE id = '00000000-0000-0000-0000-00000000a001'$$, 'an active admin can change a plan');
SELECT test_helpers.act_as_system();

SELECT * FROM finish();
ROLLBACK;
