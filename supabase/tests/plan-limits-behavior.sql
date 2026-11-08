-- Behavioral test for plan limits (20261108050610_enforce_plan_limits).
-- Run on a disposable Supabase database built from every migration, as a superuser.
-- Everything rolls back. Do not run against production.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(37);

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

-- Claims as many runs as asked and returns how many were allowed.
CREATE FUNCTION test_helpers.claim_runs(target_user uuid, attempts integer) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  allowed_count integer := 0;
BEGIN
  FOR i IN 1..attempts LOOP
    IF (public.claim_audit_run(target_user, gen_random_uuid())->>'allowed')::boolean THEN
      allowed_count := allowed_count + 1;
    END IF;
  END LOOP;
  RETURN allowed_count;
END;
$$;

GRANT USAGE ON SCHEMA test_helpers TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test_helpers TO service_role;

-- A guest, a Free account, a Monitor account, an Agency account and an admin.
INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('00000000-0000-0000-0000-0000000000a1', NULL, true),
  ('00000000-0000-0000-0000-0000000000b2', 'free@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000c3', 'monitor@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000d4', 'agency@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000e5', 'admin@example.invalid', false);

-- Audit limits follow the plan
SELECT is((SELECT audit_limit FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000b2'), 1, 'a new Free profile gets 1 audit a month');
UPDATE public.user_profiles SET tier = 'pro' WHERE id = '00000000-0000-0000-0000-0000000000c3';
SELECT is((SELECT audit_limit FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000c3'), 30, 'moving to Monitor sets 30');
UPDATE public.user_profiles SET tier = 'enterprise' WHERE id = '00000000-0000-0000-0000-0000000000d4';
SELECT is((SELECT audit_limit FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000d4'), -1, 'moving to Agency removes the cap');
UPDATE public.user_profiles SET tier = 'basic', audit_limit = 30 WHERE id = '00000000-0000-0000-0000-0000000000c3';
SELECT is((SELECT audit_limit FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000c3'), 1, 'a plan change sets that plan''s limit, even when the update repeats the old limit');
UPDATE public.user_profiles SET audit_limit = 7 WHERE id = '00000000-0000-0000-0000-0000000000c3';
SELECT is((SELECT audit_limit FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000c3'), 7, 'a custom limit set on its own is kept');
UPDATE public.user_profiles SET tier = 'pro' WHERE id = '00000000-0000-0000-0000-0000000000c3';
SELECT is((SELECT audit_limit FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000c3'), 30, 'and the next plan change resets it');
UPDATE public.user_profiles SET is_admin = true WHERE id = '00000000-0000-0000-0000-0000000000e5';

-- Last month's runs and letters do not count
INSERT INTO public.audit_quota_claims (session_id, user_id, created_at) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000b2', public.quota_period_start() - interval '1 day');
INSERT INTO public.demand_letters (user_id, file_name, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000c3', 'last-month.pdf', public.quota_period_start() - interval '1 day');

-- Audits, as run-lighthouse-audit calls them
SELECT test_helpers.act_as('service_role', NULL);
SELECT is((public.claim_audit_run('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000aa01')->>'allowed')::boolean, true, 'a guest gets their first audit of the month');
SELECT is(public.claim_audit_run('00000000-0000-0000-0000-0000000000a1', gen_random_uuid()), '{"allowed": false, "limit": 1, "used": 1, "period": "month"}'::jsonb, 'and not a second');
SELECT lives_ok($$SELECT public.release_audit_run('00000000-0000-0000-0000-00000000aa01')$$, 'a failed run is released');
SELECT is((public.claim_audit_run('00000000-0000-0000-0000-0000000000a1', gen_random_uuid())->>'allowed')::boolean, true, 'which gives the run back');
SELECT is(test_helpers.claim_runs('00000000-0000-0000-0000-0000000000b2', 2), 1, 'Free gets 1 audit a month; last month''s run does not count');
SELECT is(test_helpers.claim_runs('00000000-0000-0000-0000-0000000000c3', 31), 30, 'Monitor gets 30');
SELECT is(test_helpers.claim_runs('00000000-0000-0000-0000-0000000000d4', 40), 40, 'Agency has no cap');
SELECT is(test_helpers.claim_runs('00000000-0000-0000-0000-0000000000e5', 5), 5, 'an active admin has no cap');

-- Letters, as analyze-document saves them
SELECT is(public.letter_quota('00000000-0000-0000-0000-0000000000a1'), '{"allowed": true, "limit": 1, "used": 0, "period": "total", "anonymous": true}'::jsonb, 'a guest may save 1 letter in total');
SELECT lives_ok($$SELECT public.insert_demand_letter('00000000-0000-0000-0000-0000000000a1', true, '{"file_name": "g1.pdf"}')$$, 'a guest saves their first letter');
SELECT throws_ok($$SELECT public.insert_demand_letter('00000000-0000-0000-0000-0000000000a1', true, '{"file_name": "g2.pdf"}')$$, 'P0001', 'ANONYMOUS_LETTER_LIMIT', 'and not a second');
SELECT lives_ok($$SELECT public.insert_demand_letter('00000000-0000-0000-0000-0000000000b2', false, '{"file_name": "f1.pdf"}')$$, 'Free saves 1 letter');
SELECT throws_ok($$SELECT public.insert_demand_letter('00000000-0000-0000-0000-0000000000b2', true, '{"file_name": "f2.pdf"}')$$, 'P0001', 'LETTER_LIMIT', 'and not a second, whatever the caller claims about being a guest');
SELECT is((public.letter_quota('00000000-0000-0000-0000-0000000000c3')->>'used')::int, 0, 'Monitor''s letter from last month does not count');
SELECT lives_ok($$SELECT public.insert_demand_letter('00000000-0000-0000-0000-0000000000c3', false, jsonb_build_object('file_name', 'm' || n || '.pdf')) FROM generate_series(1, 5) AS n$$, 'Monitor saves 5 letters this month');
SELECT throws_ok($$SELECT public.insert_demand_letter('00000000-0000-0000-0000-0000000000c3', false, '{"file_name": "m6.pdf"}')$$, 'P0001', 'LETTER_LIMIT', 'and not a sixth');
SELECT lives_ok($$SELECT public.insert_demand_letter('00000000-0000-0000-0000-0000000000d4', false, jsonb_build_object('file_name', 'a' || n || '.pdf')) FROM generate_series(1, 7) AS n$$, 'Agency has no letter cap');
SELECT lives_ok($$SELECT public.insert_demand_letter('00000000-0000-0000-0000-0000000000e5', false, jsonb_build_object('file_name', 'x' || n || '.pdf')) FROM generate_series(1, 3) AS n$$, 'nor does an active admin');
SELECT test_helpers.act_as_system();

-- Browser clients can read only their own usage
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000b2');
SELECT is(public.my_audit_usage(), '{"limit": 1, "used": 1, "period": "month"}'::jsonb, 'an account sees its own monthly usage');
SELECT throws_ok($$SELECT public.claim_audit_run('00000000-0000-0000-0000-0000000000b2', gen_random_uuid())$$, '42501', NULL, 'browser cannot claim runs');
SELECT throws_ok($$SELECT public.release_audit_run(gen_random_uuid())$$, '42501', NULL, 'browser cannot release runs');
SELECT throws_ok($$SELECT public.letter_quota('00000000-0000-0000-0000-0000000000b2')$$, '42501', NULL, 'browser cannot call the letter quota');
SELECT throws_ok($$SELECT count(*) FROM public.audit_quota_claims$$, '42501', NULL, 'browser cannot read the claims table');
SELECT throws_ok($$SELECT public.audit_limit_for('00000000-0000-0000-0000-0000000000b2')$$, '42501', NULL, 'browser cannot call internal helpers');
SELECT throws_ok($$UPDATE public.user_profiles SET audit_limit = 999 WHERE id = '00000000-0000-0000-0000-0000000000b2'$$, 'P0001', 'protected profile fields cannot be changed', 'an account cannot raise its own limit');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT throws_ok($$UPDATE public.demand_letters SET created_at = now() - interval '2 months' WHERE user_id = '00000000-0000-0000-0000-0000000000c3'$$, 'P0001', 'letter creation time cannot be changed', 'an owner cannot backdate letters out of the month');
SELECT lives_ok($$UPDATE public.demand_letters SET status = 'reviewed' WHERE user_id = '00000000-0000-0000-0000-0000000000c3' AND file_name = 'm1.pdf'$$, 'but can still edit them');
SELECT test_helpers.act_as_system();
SELECT is((SELECT status FROM public.demand_letters WHERE user_id = '00000000-0000-0000-0000-0000000000c3' AND file_name = 'm1.pdf'), 'reviewed', 'and the edit is saved');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT is((public.my_audit_usage()->>'limit')::int, 1, 'a guest sees a limit of 1');
SELECT test_helpers.act_as('anon', NULL);
SELECT throws_ok($$SELECT public.my_audit_usage()$$, '42501', NULL, 'signed-out visitors cannot read usage');
SELECT test_helpers.act_as_system();

-- Deleting an account deletes its claims
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000c3';
SELECT is((SELECT count(*)::int FROM public.audit_quota_claims WHERE user_id = '00000000-0000-0000-0000-0000000000c3'), 0, 'deleting an account deletes its audit claims');

SELECT * FROM finish();
ROLLBACK;
