-- Behavioral test for the Accessibility Remediation Record (20261126120000_monitor_remediation_record).
-- Run on a disposable Supabase database built from every migration, as a superuser.
-- Everything rolls back. Do not run against production.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(27);

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

-- Plays the worker: claims every pending page of the queue and reports
-- findings per URL from p_findings ({url: [rule ids]}). URLs listed in
-- p_failed fail without a retry.
CREATE FUNCTION test_helpers.work_queue(p_findings jsonb, p_failed text[] DEFAULT ARRAY[]::text[]) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  v_claim record;
  v_done integer := 0;
BEGIN
  LOOP
    SELECT * INTO v_claim FROM public.claim_scan_pages(1);
    EXIT WHEN NOT FOUND;
    IF v_claim.url = ANY (p_failed) THEN
      PERFORM public.fail_scan_page(v_claim.result_id, 'pagespeed_runtime_error', false);
    ELSE
      PERFORM public.complete_scan_page(
        v_claim.result_id,
        90,
        coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'rule_id', rule, 'title', 'Rule ' || rule, 'severity', 'serious',
            'element_count', 1, 'items', '[]'::jsonb
          ))
          FROM jsonb_array_elements_text(p_findings -> v_claim.url) AS rule
        ), '[]'::jsonb)
      );
    END IF;
    v_done := v_done + 1;
  END LOOP;
  RETURN v_done;
END;
$$;

GRANT USAGE ON SCHEMA test_helpers TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test_helpers TO service_role;

-- Backdates the history so far by p_days. Inside one transaction now() never
-- moves, so without this every row would sit exactly at a record's end.
CREATE FUNCTION test_helpers.backdate(p_days integer) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  ALTER TABLE public.issue_events DISABLE TRIGGER issue_events_append_only;
  UPDATE public.issue_events SET created_at = created_at - make_interval(days => p_days);
  ALTER TABLE public.issue_events ENABLE TRIGGER issue_events_append_only;
  UPDATE public.scan_runs SET
    created_at = created_at - make_interval(days => p_days),
    started_at = started_at - make_interval(days => p_days),
    completed_at = completed_at - make_interval(days => p_days);
END;
$$;

INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('00000000-0000-0000-0000-0000000000c3', 'owner@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000c4', 'other@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000b2', 'free@example.invalid', false);
INSERT INTO public.monitor_allowlist (user_id) VALUES
  ('00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000c4');

-- Ten days ago: first scan finds two issues. The owner marks one fixed and a
-- re-check confirms it.
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.create_site('Shop', 'https://shop.example.com', ARRAY['https://shop.example.com/']);
SELECT test_helpers.act_as('service_role', NULL);
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt", "link-name"]}');
SELECT test_helpers.act_as_system();
SELECT set_config('test.site', (SELECT id::text FROM public.sites), true);
SELECT set_config('test.image_alt', (SELECT id::text FROM public.issues WHERE rule_id = 'image-alt'), true);
SELECT set_config('test.link_name', (SELECT id::text FROM public.issues WHERE rule_id = 'link-name'), true);
SELECT set_config('test.home', (SELECT id::text FROM public.site_pages), true);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.mark_issue_fixed(current_setting('test.image_alt')::uuid, 'Added alt text');
SELECT public.request_page_recheck(current_setting('test.home')::uuid);
SELECT test_helpers.act_as('service_role', NULL);
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["link-name"]}');
SELECT test_helpers.act_as_system();
SELECT test_helpers.backdate(10);

-- Who can make a record
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000b2');
SELECT throws_ok(
  $$ SELECT public.create_remediation_record(current_setting('test.site')::uuid, now() - interval '30 days', now()) $$,
  'P0001', 'MONITOR_NOT_ENABLED', 'an account without Monitor cannot make a record'
);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT throws_ok(
  $$ SELECT public.create_remediation_record(current_setting('test.site')::uuid, now() - interval '30 days', now()) $$,
  'P0001', 'NOT_FOUND', 'another account cannot make a record of the owner''s site'
);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT throws_ok(
  $$ SELECT public.create_remediation_record(current_setting('test.site')::uuid, now(), now() - interval '1 day') $$,
  'P0001', 'INVALID_PERIOD', 'the period must end after it starts'
);
SELECT throws_ok(
  $$ SELECT public.create_remediation_record(current_setting('test.site')::uuid, now() - interval '400 days', now()) $$,
  'P0001', 'INVALID_PERIOD', 'a period is at most about a year'
);
SELECT throws_ok(
  $$ SELECT public.create_remediation_record(current_setting('test.site')::uuid, now() + interval '1 day', now() + interval '2 days') $$,
  'P0001', 'INVALID_PERIOD', 'a period cannot start in the future'
);

-- Making a record
CREATE TEMP TABLE made (payload jsonb);
GRANT ALL ON made TO authenticated, anon;
INSERT INTO made SELECT public.create_remediation_record(current_setting('test.site')::uuid, now() - interval '30 days', now() + interval '5 days');
SELECT is((SELECT (payload #>> '{record,period_end}')::timestamptz FROM made), now(), 'a period never ends after the record is made');
SELECT is((SELECT (payload #>> '{record,run_count}')::integer FROM made), 2, 'the record covers both finished scans');
SELECT is((SELECT (payload #>> '{record,event_count}')::integer FROM made), 4, 'and every history event so far');
SELECT is(
  (SELECT string_agg(event ->> 'kind', ',' ORDER BY (event ->> 'id')::bigint) FROM made, jsonb_array_elements(payload -> 'events') AS event),
  'detected,detected,marked_fixed,fix_confirmed',
  'the returned history is what was fingerprinted, in order'
);
SELECT is((SELECT jsonb_array_length(payload -> 'runs') FROM made), 2, 'and the returned runs too');
SELECT is((SELECT jsonb_array_length(payload -> 'issues') FROM made), 2, 'with the issues the history refers to');
SELECT is((SELECT payload #>> '{site,origin}' FROM made), 'https://shop.example.com', 'and the site');
SELECT ok((SELECT payload #>> '{record,fingerprint}' FROM made) ~ '^[0-9a-f]{64}$', 'the fingerprint is a SHA-256 hex digest');
SELECT is((SELECT count(*)::integer FROM public.remediation_records), 1, 'the owner can read the saved record');

SELECT is(
  public.remediation_record_contents((SELECT (payload #>> '{record,id}')::uuid FROM made)),
  (SELECT payload FROM made),
  'printing the record again returns the same contents'
);

SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT is((SELECT count(*)::integer FROM public.remediation_records), 0, 'another account cannot read it');
SELECT throws_ok(
  format('SELECT public.remediation_record_contents(%L)', (SELECT payload #>> '{record,id}' FROM made)),
  'P0001', 'NOT_FOUND', 'or its contents'
);
SELECT throws_ok(
  $$ INSERT INTO public.remediation_records (site_id, owner_id, period_start, period_end, run_count, event_count, fingerprint)
     VALUES (current_setting('test.site')::uuid, auth.uid(), now() - interval '1 day', now(), 0, 0, repeat('a', 64)) $$,
  '42501', NULL, 'browsers cannot write records directly'
);

-- Verifying
SELECT test_helpers.act_as('anon', NULL);
SELECT is(
  (SELECT matches FROM public.verify_remediation_record((SELECT (payload #>> '{record,id}')::uuid FROM made))),
  true,
  'anyone with the id can verify an unchanged record'
);
SELECT is(
  (SELECT count(*)::integer FROM public.verify_remediation_record(gen_random_uuid())),
  0,
  'an unknown id verifies nothing'
);
SELECT throws_ok($$ SELECT * FROM public.remediation_records $$, '42501', NULL, 'signed-out visitors cannot list records');
SELECT throws_ok(
  format('SELECT public.remediation_record_contents(%L)', (SELECT payload #>> '{record,id}' FROM made)),
  '42501', NULL, 'or read a record''s contents'
);

-- New activity after the period does not change the record.
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.mark_issue_fixed(current_setting('test.link_name')::uuid, 'Named the links');
SELECT test_helpers.act_as('anon', NULL);
SELECT is(
  (SELECT matches FROM public.verify_remediation_record((SELECT (payload #>> '{record,id}')::uuid FROM made))),
  true,
  'later history does not change an earlier record'
);

-- Altered history does.
SELECT test_helpers.act_as_system();
UPDATE public.scan_runs SET pages_failed = pages_failed + 1
WHERE id = (SELECT id FROM public.scan_runs ORDER BY completed_at LIMIT 1);
SELECT test_helpers.act_as('anon', NULL);
SELECT is(
  (SELECT matches FROM public.verify_remediation_record((SELECT (payload #>> '{record,id}')::uuid FROM made))),
  false,
  'a changed scan no longer matches'
);
SELECT test_helpers.act_as_system();
UPDATE public.scan_runs SET pages_failed = pages_failed - 1
WHERE id = (SELECT id FROM public.scan_runs ORDER BY completed_at LIMIT 1);
ALTER TABLE public.issue_events DISABLE TRIGGER issue_events_append_only;
DELETE FROM public.issue_events WHERE kind = 'marked_fixed' AND note = 'Added alt text';
ALTER TABLE public.issue_events ENABLE TRIGGER issue_events_append_only;
SELECT test_helpers.act_as('anon', NULL);
SELECT is(
  (SELECT matches FROM public.verify_remediation_record((SELECT (payload #>> '{record,id}')::uuid FROM made))),
  false,
  'a removed history event no longer matches'
);

-- Limits and clean-up
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.create_remediation_record(current_setting('test.site')::uuid, now() - interval '30 days', now())
FROM generate_series(1, 19);
SELECT throws_ok(
  $$ SELECT public.create_remediation_record(current_setting('test.site')::uuid, now() - interval '30 days', now()) $$,
  'P0001', 'RECORD_RATE_LIMIT', 'at most 20 records a day per site'
);

SELECT test_helpers.act_as_system();
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000c3';
SELECT is((SELECT count(*)::integer FROM public.remediation_records), 0, 'deleting the account deletes its records');

SELECT * FROM finish();
ROLLBACK;
