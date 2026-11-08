-- Behavioral test for tenant isolation.
-- Run on a disposable Supabase database built from every migration, as a superuser.
-- Everything rolls back. Do not run against production.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(17);

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

-- Tenant A, tenant B, and a guest. Guests hold the authenticated role.
INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'tenant-a@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000b2', 'tenant-b@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000c3', NULL, true);

INSERT INTO public.accessibility_audits (id, url_scanned, user_id) VALUES
  ('00000000-0000-0000-0000-0000000000aa', 'https://a.example.invalid', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000ab', 'https://b.example.invalid', '00000000-0000-0000-0000-0000000000b2');

INSERT INTO public.violations (id, audit_id, wcag_guideline, severity, title) VALUES
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000aa', '1.1.1', 'minor', 'A violation'),
  ('00000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-0000000000ab', '1.1.1', 'minor', 'B violation');

INSERT INTO public.demand_letters (id, user_id, file_name) VALUES
  ('00000000-0000-0000-0000-0000000000da', '00000000-0000-0000-0000-0000000000a1', 'a.pdf'),
  ('00000000-0000-0000-0000-0000000000db', '00000000-0000-0000-0000-0000000000b2', 'b.pdf');

-- Tenant A sees only their own rows
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT is((SELECT count(*)::int FROM public.accessibility_audits), 1, 'tenant sees only their own audits');
SELECT is((SELECT count(*)::int FROM public.violations), 1, 'tenant sees only their own violations');
SELECT is((SELECT count(*)::int FROM public.demand_letters), 1, 'tenant sees only their own letters');
SELECT is((SELECT id FROM public.demand_letters), '00000000-0000-0000-0000-0000000000da'::uuid, 'and it is theirs');

-- Tenant A cannot change or remove tenant B's rows
SELECT lives_ok($$UPDATE public.demand_letters SET file_name = 'taken.pdf' WHERE id = '00000000-0000-0000-0000-0000000000db'$$, 'updating another tenant''s letter runs');
SELECT test_helpers.act_as_system();
SELECT is((SELECT file_name FROM public.demand_letters WHERE id = '00000000-0000-0000-0000-0000000000db'), 'b.pdf', 'and changes nothing');

-- Browser clients cannot write audits, violations or letters
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok($$INSERT INTO public.accessibility_audits (url_scanned, user_id) VALUES ('https://x.example.invalid', '00000000-0000-0000-0000-0000000000a1')$$, '42501', NULL, 'browser cannot create audits');
SELECT throws_ok($$INSERT INTO public.demand_letters (user_id, file_name) VALUES ('00000000-0000-0000-0000-0000000000a1', 'x.pdf')$$, '42501', NULL, 'browser cannot create letters');

-- Guests get the same boundary
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT is((SELECT count(*)::int FROM public.accessibility_audits), 0, 'a guest sees no one else''s audits');
SELECT is((SELECT count(*)::int FROM public.violations), 0, 'a guest sees no one else''s violations');
SELECT is((SELECT count(*)::int FROM public.demand_letters), 0, 'a guest sees no one else''s letters');

-- Signed-out visitors see nothing
SELECT test_helpers.act_as('anon', NULL);
SELECT is((SELECT count(*)::int FROM public.accessibility_audits), 0, 'signed-out visitors see no audits');
SELECT is((SELECT count(*)::int FROM public.demand_letters), 0, 'signed-out visitors see no letters');
SELECT test_helpers.act_as_system();

-- Letters and audits can no longer lose their owner
SELECT throws_ok($$INSERT INTO public.demand_letters (file_name) VALUES ('orphan.pdf')$$, '23502', NULL, 'a letter must have an owner');
SELECT throws_ok($$INSERT INTO public.accessibility_audits (url_scanned) VALUES ('https://orphan.example.invalid')$$, '23502', NULL, 'an audit must have an owner');

DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b2';
SELECT is((SELECT count(*)::int FROM public.demand_letters WHERE id = '00000000-0000-0000-0000-0000000000db'), 0, 'deleting an account deletes its letters');
SELECT is((SELECT count(*)::int FROM public.violations WHERE id = '00000000-0000-0000-0000-0000000000cb'), 0, 'and its audits and violations');

SELECT * FROM finish();
ROLLBACK;
