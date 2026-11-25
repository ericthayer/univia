-- Behavioral test for the Monitor fix tracker (20261125140000_monitor_fix_tracker).
-- Run on a disposable Supabase database built from every migration, as a superuser.
-- Everything rolls back. Do not run against production.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(31);


CREATE EXTENSION IF NOT EXISTS pgtap;


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

-- An invited owner, another invited account, a Free account.
INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('00000000-0000-0000-0000-0000000000c3', 'owner@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000c4', 'other@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000b2', 'free@example.invalid', false);
INSERT INTO public.monitor_allowlist (user_id) VALUES
  ('00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000c4');

-- A site with two pages, scanned once: two issues on /, one on /about.
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.create_site('Shop', 'https://shop.example.com', ARRAY['https://shop.example.com/', 'https://shop.example.com/about']);
SELECT test_helpers.act_as('service_role', NULL);
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["image-alt", "link-name"], "https://shop.example.com/about": ["label"]}');

CREATE TEMP VIEW tracked AS
  SELECT issues.id, issues.rule_id, issues.state, issues.page_id
  FROM public.issues;
GRANT SELECT ON tracked TO authenticated;

-- Marking fixed
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000b2');
SELECT throws_ok(
  $$ SELECT public.mark_issue_fixed((SELECT id FROM tracked WHERE rule_id = 'image-alt'), NULL) $$,
  'P0001', 'MONITOR_NOT_ENABLED', 'an account without Monitor cannot mark issues'
);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT throws_ok(
  format('SELECT public.mark_issue_fixed(%L, NULL)', (SELECT id FROM public.issues WHERE rule_id = 'image-alt' LIMIT 0)),
  'P0001', 'NOT_FOUND', 'an unknown issue is not found'
);
SELECT test_helpers.act_as_system();
SELECT set_config('test.image_alt', (SELECT id::text FROM public.issues WHERE rule_id = 'image-alt'), true);
SELECT set_config('test.link_name', (SELECT id::text FROM public.issues WHERE rule_id = 'link-name'), true);
SELECT set_config('test.label', (SELECT id::text FROM public.issues WHERE rule_id = 'label'), true);
SELECT set_config('test.home', (SELECT id::text FROM public.site_pages WHERE url = 'https://shop.example.com/'), true);
SELECT set_config('test.about', (SELECT id::text FROM public.site_pages WHERE url = 'https://shop.example.com/about'), true);

SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT throws_ok(
  $$ SELECT public.mark_issue_fixed(current_setting('test.image_alt')::uuid, NULL) $$,
  'P0001', 'NOT_FOUND', 'another account cannot mark the owner''s issue'
);

SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT throws_ok(
  $$ SELECT public.mark_issue_fixed(current_setting('test.image_alt')::uuid, repeat('x', 1001)) $$,
  'P0001', 'NOTE_TOO_LONG', 'notes are at most 1000 characters'
);
SELECT lives_ok(
  $$ SELECT public.mark_issue_fixed(current_setting('test.image_alt')::uuid, '  Added alt text to the hero image  ') $$,
  'the owner marks an open issue fixed'
);
SELECT is((SELECT state FROM public.issues WHERE id = current_setting('test.image_alt')::uuid), 'marked_fixed', 'its state is marked fixed');
SELECT is(
  (SELECT kind || '/' || (actor_id = '00000000-0000-0000-0000-0000000000c3') || '/' || note || '/' || (run_id IS NULL)
   FROM public.issue_events WHERE issue_id = current_setting('test.image_alt')::uuid ORDER BY id DESC LIMIT 1),
  'marked_fixed/true/Added alt text to the hero image/true',
  'the history records who marked it, with the trimmed note'
);
SELECT throws_ok(
  $$ SELECT public.mark_issue_fixed(current_setting('test.image_alt')::uuid, NULL) $$,
  'P0001', 'INVALID_STATE', 'an issue cannot be marked twice'
);

-- Undo
SELECT throws_ok(
  $$ SELECT public.undo_mark_fixed(current_setting('test.link_name')::uuid) $$,
  'P0001', 'INVALID_STATE', 'only a marked issue can be unmarked'
);
SELECT public.mark_issue_fixed(current_setting('test.link_name')::uuid, NULL);
SELECT lives_ok($$ SELECT public.undo_mark_fixed(current_setting('test.link_name')::uuid) $$, 'the owner takes back a mark');
SELECT is((SELECT state FROM public.issues WHERE id = current_setting('test.link_name')::uuid), 'open', 'the issue is open again');
SELECT is(
  (SELECT string_agg(kind, ',' ORDER BY id) FROM public.issue_events WHERE issue_id = current_setting('test.link_name')::uuid),
  'detected,marked_fixed,unmarked_fixed',
  'and both steps stay in the history'
);
SELECT public.mark_issue_fixed(current_setting('test.link_name')::uuid, NULL);

-- One-page re-check
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT throws_ok(
  $$ SELECT public.request_page_recheck(current_setting('test.home')::uuid) $$,
  'P0001', 'NOT_FOUND', 'another account cannot re-check the owner''s page'
);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT lives_ok($$ SELECT public.request_page_recheck(current_setting('test.home')::uuid) $$, 'the owner re-checks one page');
SELECT is(
  (SELECT trigger || '/' || status || '/' || pages_total FROM public.scan_runs ORDER BY created_at DESC, trigger DESC LIMIT 1),
  'recheck/queued/1',
  'the re-check is a one-page run'
);
SELECT throws_ok(
  $$ SELECT public.request_page_recheck(current_setting('test.about')::uuid) $$,
  'P0001', 'SCAN_IN_PROGRESS', 'not while another run is unfinished'
);
SELECT throws_ok(
  $$ SELECT public.mark_issue_fixed(current_setting('test.label')::uuid, NULL) $$,
  'P0001', 'SCAN_IN_PROGRESS', 'issues cannot be marked fixed while a scan may hold results from before the fix'
);

-- The scan still finds link-name but no longer finds image-alt.
SELECT test_helpers.act_as('service_role', NULL);
SELECT is(test_helpers.work_queue('{"https://shop.example.com/": ["link-name"]}'), 1, 'the worker scans only that page');
SELECT is((SELECT state FROM public.issues WHERE id = current_setting('test.image_alt')::uuid), 'resolved', 'a fix the scan agrees with is resolved');
SELECT is(
  (SELECT kind FROM public.issue_events WHERE issue_id = current_setting('test.image_alt')::uuid ORDER BY id DESC LIMIT 1),
  'fix_confirmed', 'and recorded as confirmed'
);
SELECT is((SELECT state FROM public.issues WHERE id = current_setting('test.link_name')::uuid), 'open', 'a fix the scan disagrees with is open again');
SELECT is(
  (SELECT kind FROM public.issue_events WHERE issue_id = current_setting('test.link_name')::uuid ORDER BY id DESC LIMIT 1),
  'fix_not_confirmed', 'and recorded as not confirmed'
);
SELECT is((SELECT state FROM public.issues WHERE id = current_setting('test.label')::uuid), 'open', 'issues on pages the re-check did not cover are untouched');
SELECT is(
  (SELECT open_issues FROM public.scan_runs WHERE trigger = 'recheck'),
  2, 'the re-check reports the site''s open issues'
);

-- Limits and scheduling
SELECT test_helpers.act_as_system();
INSERT INTO public.scan_runs (site_id, trigger, status, created_at)
SELECT (SELECT id FROM public.sites), 'recheck', 'completed', now() - interval '1 hour'
FROM generate_series(1, 9);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT throws_ok(
  $$ SELECT public.request_page_recheck(current_setting('test.about')::uuid) $$,
  'P0001', 'RECHECK_RATE_LIMIT', 'at most 10 re-checks per site per day'
);
SELECT test_helpers.act_as_system();
UPDATE public.scan_runs SET created_at = created_at - interval '8 days' WHERE trigger = 'initial';
SELECT test_helpers.act_as('service_role', NULL);
SELECT is(public.enqueue_due_scans(), 1, 're-checks do not postpone the weekly scan');

-- Removed pages and signed-out visitors
SELECT test_helpers.act_as_system();
DELETE FROM public.scan_runs WHERE status IN ('queued', 'running');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.remove_site_page(current_setting('test.about')::uuid);
SELECT throws_ok(
  $$ SELECT public.mark_issue_fixed(current_setting('test.label')::uuid, NULL) $$,
  'P0001', 'NOT_FOUND', 'issues on a removed page cannot be marked'
);
SELECT throws_ok(
  $$ SELECT public.request_page_recheck(current_setting('test.about')::uuid) $$,
  'P0001', 'NOT_FOUND', 'a removed page cannot be re-checked'
);
SELECT test_helpers.act_as('anon', NULL);
SELECT throws_ok(
  $$ SELECT public.mark_issue_fixed(current_setting('test.link_name')::uuid, NULL) $$,
  '42501', NULL, 'signed-out visitors cannot mark issues'
);
SELECT throws_ok(
  $$ SELECT public.request_page_recheck(current_setting('test.home')::uuid) $$,
  '42501', NULL, 'or request re-checks'
);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT throws_ok(
  $$ SELECT public.create_scan_run((SELECT id FROM public.sites), 'recheck', NULL) $$,
  '42501', NULL, 'browsers cannot queue runs directly'
);

SELECT * FROM finish();
ROLLBACK;
