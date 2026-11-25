-- Behavioral test for Monitor scan alerts (20261125140000_monitor_scan_alerts).
-- Run on a disposable Supabase database built from every migration, as a superuser.
-- Everything rolls back. Do not run against production.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(36);

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


-- A guest, an invited account and another invited account.
INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('00000000-0000-0000-0000-0000000000a1', NULL, true),
  ('00000000-0000-0000-0000-0000000000c3', 'invited@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000c4', 'other@example.invalid', false);
INSERT INTO public.monitor_allowlist (user_id) VALUES
  ('00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000c4');

CREATE FUNCTION test_helpers.outbox_count() RETURNS bigint LANGUAGE sql AS $$ SELECT count(*) FROM public.email_outbox $$;
CREATE FUNCTION test_helpers.new_run() RETURNS uuid LANGUAGE sql AS $$
  SELECT public.create_scan_run((SELECT id FROM public.sites WHERE owner_id = '00000000-0000-0000-0000-0000000000c3'), 'manual')
$$;

-- First scan: everything it finds is new, so one alert is queued
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.create_site('Shop', 'https://shop.example.com', ARRAY['https://shop.example.com/', 'https://shop.example.com/about']);
SELECT test_helpers.act_as_system();
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt", "color-contrast"], "https://shop.example.com/about": ["label"]}');
SELECT is(test_helpers.outbox_count(), 1::bigint, 'a completed run with new issues queues one alert');
SELECT is((SELECT status FROM public.email_outbox), 'pending', 'the alert waits to be sent');

-- Browsers never see or touch the outbox or the worker functions
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT throws_ok($$ SELECT count(*) FROM public.email_outbox $$, '42501', NULL, 'owners cannot read the outbox');
SELECT throws_ok($$ SELECT * FROM public.claim_email_outbox(5) $$, '42501', NULL, 'owners cannot claim mail');
SELECT throws_ok($$ SELECT public.unsubscribe_scan_alerts(gen_random_uuid()) $$, '42501', NULL, 'owners cannot call the token unsubscribe directly');
SELECT test_helpers.act_as('anon', NULL);
SELECT throws_ok($$ SELECT public.set_scan_alerts(false) $$, '42501', NULL, 'signed-out visitors cannot change settings');

-- Claiming returns what the email needs, once
SELECT test_helpers.act_as('service_role', NULL);
CREATE TEMP TABLE claimed ON COMMIT DROP AS SELECT * FROM public.claim_email_outbox(5);
SELECT is((SELECT count(*) FROM claimed), 1::bigint, 'the worker claims the alert');
SELECT is((SELECT to_email FROM claimed), 'invited@example.invalid', 'addressed to the site owner');
SELECT is((SELECT jsonb_array_length(payload->'events') FROM claimed), 3, 'it lists all three new issues');
SELECT is((SELECT payload->'events'->0->>'severity' FROM claimed), 'serious', 'most severe first');
SELECT is((SELECT payload->>'trigger' FROM claimed), 'initial', 'the first scan is marked as such');
SELECT isnt((SELECT payload->>'unsubscribe_token' FROM claimed), NULL, 'with an unsubscribe token');
SELECT is((SELECT count(*) FROM public.claim_email_outbox(5)), 0::bigint, 'a claimed alert is not claimed twice');

-- Retry, then success
SELECT public.fail_email_outbox((SELECT outbox_id FROM claimed), 'resend_503', true);
SELECT is((SELECT status FROM public.email_outbox), 'pending', 'a retryable failure goes back to the queue');
SELECT is((SELECT count(*) FROM public.claim_email_outbox(5)), 0::bigint, 'but not before its wait is over');
SELECT test_helpers.act_as_system();
UPDATE public.email_outbox SET not_before = now() - interval '1 second';
SELECT test_helpers.act_as('service_role', NULL);
SELECT is((SELECT count(*) FROM public.claim_email_outbox(5)), 1::bigint, 'after the wait it is claimed again');
SELECT public.complete_email_outbox((SELECT outbox_id FROM claimed), 're_123');
SELECT is((SELECT status || ':' || attempts || ':' || provider_id FROM public.email_outbox), 'sent:2:re_123', 'sent on the second attempt, with the provider id');

-- An unchanged run sends nothing
SELECT test_helpers.act_as_system();
SELECT test_helpers.new_run();
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt", "color-contrast"], "https://shop.example.com/about": ["label"]}');
SELECT is(test_helpers.outbox_count(), 1::bigint, 'a run with nothing new queues no alert');

-- A resolved issue that comes back is worth an alert
SELECT test_helpers.new_run();
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt"], "https://shop.example.com/about": ["label"]}');
SELECT is(test_helpers.outbox_count(), 1::bigint, 'a run that only resolves issues queues no alert');
SELECT test_helpers.new_run();
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt", "color-contrast"], "https://shop.example.com/about": ["label"]}');
SELECT is(test_helpers.outbox_count(), 2::bigint, 'an issue that comes back queues an alert');
SELECT is(
  (SELECT payload->'events'->0->>'kind' FROM public.claim_email_outbox(5)),
  'reopened', 'and says it is back'
);

-- Owners turn alerts off and on; others cannot see their setting
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT is(public.set_scan_alerts(false), false, 'an owner can turn alerts off');
SELECT is((SELECT scan_alerts FROM public.notification_settings), false, 'and reads the setting back');
SELECT throws_ok($$ SELECT unsubscribe_token FROM public.notification_settings $$, '42501', NULL, 'the unsubscribe token is not readable from the browser');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT is((SELECT count(*) FROM public.notification_settings), 0::bigint, 'another account cannot see it');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok($$ SELECT public.set_scan_alerts(true) $$, 'P0001', 'NOT_FOUND', 'guests have no email, so no alert settings');

SELECT test_helpers.act_as_system();
SELECT test_helpers.new_run();
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt", "color-contrast", "link-name"], "https://shop.example.com/about": ["label"]}');
SELECT is(test_helpers.outbox_count(), 2::bigint, 'with alerts off, a new issue queues nothing');

-- Mail already waiting when alerts go off is skipped, not sent
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.set_scan_alerts(true);
SELECT test_helpers.act_as_system();
SELECT test_helpers.new_run();
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt", "color-contrast", "link-name", "list"], "https://shop.example.com/about": ["label"]}');
SELECT is(test_helpers.outbox_count(), 3::bigint, 'with alerts back on, a new issue queues an alert');
SELECT test_helpers.act_as('service_role', NULL);
SELECT is(
  public.unsubscribe_scan_alerts((SELECT unsubscribe_token FROM public.notification_settings WHERE user_id = '00000000-0000-0000-0000-0000000000c3')),
  true, 'the email link turns alerts off'
);
SELECT is(public.unsubscribe_scan_alerts(gen_random_uuid()), false, 'an unknown token changes nothing');
SELECT is((SELECT count(*) FROM public.claim_email_outbox(5)), 0::bigint, 'waiting mail is not sent after unsubscribing');
SELECT is(
  (SELECT string_agg(status || ':' || coalesce(last_error, ''), ',') FROM public.email_outbox WHERE status NOT IN ('sent', 'sending')),
  'skipped:alerts_off', 'it is marked skipped'
);

-- Final failures and losing access
SELECT test_helpers.act_as_system();
UPDATE public.notification_settings SET scan_alerts = true;
INSERT INTO public.email_outbox (user_id, site_id, run_id)
SELECT '00000000-0000-0000-0000-0000000000c3', site_id, id FROM public.scan_runs
WHERE id NOT IN (SELECT run_id FROM public.email_outbox) LIMIT 1;
SELECT test_helpers.act_as('service_role', NULL);
SELECT public.fail_email_outbox(outbox_id, 'resend_422', false) FROM public.claim_email_outbox(5);
SELECT is(
  (SELECT status FROM public.email_outbox WHERE last_error = 'resend_422'),
  'failed', 'a failure that should not be retried is final'
);
SELECT test_helpers.act_as_system();
DELETE FROM public.monitor_allowlist WHERE user_id = '00000000-0000-0000-0000-0000000000c3';
INSERT INTO public.monitor_allowlist (user_id) VALUES ('00000000-0000-0000-0000-0000000000c3');
SELECT test_helpers.new_run();
DELETE FROM public.monitor_allowlist WHERE user_id = '00000000-0000-0000-0000-0000000000c3';
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt", "color-contrast", "link-name", "list", "bypass"], "https://shop.example.com/about": ["label"]}');
SELECT is(test_helpers.outbox_count(), 4::bigint, 'an account that lost Monitor access gets no alert');

-- Deleting the account removes its mail and settings
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000c3';
SELECT is(test_helpers.outbox_count(), 0::bigint, 'deleting the account deletes its queued mail');
SELECT is((SELECT count(*) FROM public.notification_settings), 0::bigint, 'and its settings');

SELECT * FROM finish();
ROLLBACK;
