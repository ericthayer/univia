-- Behavioral test for Monitor sites and scans (20261108140000_monitor_sites_and_scans).
-- Run on a disposable Supabase database built from every migration, as a superuser.
-- Everything rolls back. Do not run against production.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(58);

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

-- A guest, a Free account, an invited account, another invited account, an admin.
INSERT INTO auth.users (id, email, is_anonymous) VALUES
  ('00000000-0000-0000-0000-0000000000a1', NULL, true),
  ('00000000-0000-0000-0000-0000000000b2', 'free@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000c3', 'invited@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000c4', 'other@example.invalid', false),
  ('00000000-0000-0000-0000-0000000000e5', 'admin@example.invalid', false);
UPDATE public.user_profiles SET is_admin = true WHERE id = '00000000-0000-0000-0000-0000000000e5';
INSERT INTO public.monitor_allowlist (user_id) VALUES
  ('00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000c4'),
  ('00000000-0000-0000-0000-0000000000a1');

-- Who may use Monitor
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000b2');
SELECT is(public.my_monitor_access(), false, 'a Free account is not invited');
SELECT throws_ok(
  $$ SELECT public.create_site('Shop', 'https://shop.example.com', ARRAY['https://shop.example.com/']) $$,
  'P0001', 'MONITOR_NOT_ENABLED', 'a Free account cannot add a site'
);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok(
  $$ SELECT public.create_site('Shop', 'https://shop.example.com', ARRAY['https://shop.example.com/']) $$,
  'P0001', 'MONITOR_NOT_ENABLED', 'a guest cannot add a site, even on the allow-list'
);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000e5');
SELECT is(public.my_monitor_access(), true, 'an active admin can use Monitor');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT is(public.my_monitor_access(), true, 'an invited account can use Monitor');

-- Adding a site
SELECT throws_ok(
  $$ SELECT public.create_site('Shop', 'https://shop.example.com', ARRAY['https://elsewhere.example.com/']) $$,
  'P0001', 'INVALID_URL', 'pages must be on the site'
);
SELECT throws_ok(
  $$ SELECT public.create_site('Shop', 'http://shop.example.com', ARRAY['http://shop.example.com/']) $$,
  'P0001', 'INVALID_SITE', 'the site must be https'
);
SELECT throws_ok(
  $$ SELECT public.create_site('Shop', 'https://shop.example.com', (SELECT array_agg('https://shop.example.com/p' || n) FROM generate_series(1, 26) AS n)) $$,
  'P0001', 'PAGE_LIMIT', 'a site has at most 25 pages'
);
SELECT lives_ok(
  $$ SELECT public.create_site('Shop', 'HTTPS://Shop.Example.com', ARRAY['https://shop.example.com/', 'https://shop.example.com/contact', 'https://shop.example.com/']) $$,
  'an invited account adds a site'
);
SELECT is((SELECT origin FROM public.sites), 'https://shop.example.com', 'the origin is stored in lower case');
SELECT is((SELECT count(*)::integer FROM public.site_pages), 2, 'duplicate pages are skipped');
SELECT is((SELECT status || '/' || trigger || '/' || pages_total FROM public.scan_runs), 'queued/initial/2', 'the first scan is queued right away');
SELECT is((SELECT count(*)::integer FROM public.scan_page_results WHERE status = 'pending'), 2, 'with one pending row per page');
SELECT throws_ok(
  $$ SELECT public.create_site('Blog', 'https://blog.example.com', ARRAY['https://blog.example.com/']) $$,
  'P0001', 'SITE_LIMIT', 'one site per account during launch'
);
SELECT throws_ok(
  $$ INSERT INTO public.sites (owner_id, name, origin) VALUES ('00000000-0000-0000-0000-0000000000c3', 'X', 'https://x.example.com') $$,
  '42501', NULL, 'owners cannot write tables directly'
);
SELECT throws_ok(
  $$ SELECT * FROM public.claim_scan_pages(1) $$,
  '42501', NULL, 'browsers cannot claim queue work'
);
SELECT throws_ok(
  $$ SELECT public.enqueue_due_scans() $$,
  '42501', NULL, 'browsers cannot queue scans for everyone'
);
SELECT throws_ok(
  $$ SELECT public.add_site_pages((SELECT id FROM public.sites), (SELECT array_agg('https://shop.example.com/q' || n) FROM generate_series(1, 24) AS n)) $$,
  'P0001', 'PAGE_LIMIT', 'adding pages later respects the limit too'
);
SELECT is(public.add_site_pages((SELECT id FROM public.sites), ARRAY['https://shop.example.com/about']), 1, 'an owner adds a page');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000e5');
SELECT lives_ok(
  $$ SELECT public.create_site('A', 'https://a.example.com', ARRAY['https://a.example.com/']), public.create_site('B', 'https://b.example.com', ARRAY['https://b.example.com/']) $$,
  'admins are not limited to one site'
);

-- Isolation
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT is((SELECT count(*)::integer FROM public.sites) + (SELECT count(*)::integer FROM public.site_pages) + (SELECT count(*)::integer FROM public.scan_runs) + (SELECT count(*)::integer FROM public.scan_page_results), 0, 'another account sees none of it');
SELECT throws_ok(
  $$ SELECT public.add_site_pages((SELECT id FROM public.sites WHERE origin = 'https://shop.example.com'), ARRAY['https://shop.example.com/x']) $$,
  'P0001', 'NOT_FOUND', 'another account cannot add pages'
);
SELECT test_helpers.act_as('anon', NULL);
SELECT throws_ok($$ SELECT count(*) FROM public.sites $$, '42501', NULL, 'signed-out visitors cannot read sites');

-- The admin's sites are not part of the rest of this test.
SELECT test_helpers.act_as_system();
DELETE FROM public.sites WHERE owner_id = '00000000-0000-0000-0000-0000000000e5';

-- First run: the page added after it was queued is not in it.
SELECT test_helpers.act_as('service_role', NULL);
SELECT is((SELECT count(*)::integer FROM public.claim_scan_pages(5)), 2, 'the worker claims the queued pages');
SELECT is((SELECT status FROM public.scan_runs), 'running', 'and the run starts');
SELECT is((SELECT count(*)::integer FROM public.claim_scan_pages(5)), 0, 'claimed pages are not handed out twice');
SELECT public.complete_scan_page(
  (SELECT id FROM public.scan_page_results WHERE url = 'https://shop.example.com/'),
  72,
  '[{"rule_id":"image-alt","title":"Images need alt","severity":"critical","element_count":3,"items":[{"selector":"img"}]},{"rule_id":"color-contrast","title":"Contrast","severity":"serious","element_count":5,"items":[]}]'
);
SELECT is((SELECT status FROM public.scan_runs), 'running', 'the run waits for every page');
SELECT public.fail_scan_page((SELECT id FROM public.scan_page_results WHERE url = 'https://shop.example.com/contact'), 'pagespeed_timeout', true);
SELECT is((SELECT status FROM public.scan_page_results WHERE url = 'https://shop.example.com/contact'), 'pending', 'a retryable failure goes back in the queue');
SELECT is((SELECT attempts FROM public.claim_scan_pages(1)), 2, 'and is retried');
SELECT public.fail_scan_page((SELECT id FROM public.scan_page_results WHERE url = 'https://shop.example.com/contact'), 'pagespeed_runtime_error', false);
SELECT is(
  (SELECT status || '/' || pages_succeeded || '/' || pages_failed || '/' || new_issues || '/' || open_issues FROM public.scan_runs),
  'completed/1/1/2/2',
  'a run with one failed page still completes and reports it'
);
SELECT is((SELECT string_agg(rule_id || ':' || state || ':' || severity, ',' ORDER BY rule_id) FROM public.issues), 'color-contrast:open:serious,image-alt:open:critical', 'each failing rule on a page is one open issue');
SELECT is((SELECT count(*)::integer FROM public.issue_events WHERE kind = 'detected'), 2, 'and each is recorded as detected');

-- The owner sees their own results.
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT is((SELECT count(*)::integer FROM public.issues) + (SELECT count(*)::integer FROM public.issue_events), 4, 'the owner reads their issues and history');
SELECT throws_ok($$ UPDATE public.issues SET state = 'resolved' $$, '42501', NULL, 'the owner cannot change an issue directly');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT is((SELECT count(*)::integer FROM public.issues) + (SELECT count(*)::integer FROM public.issue_events), 0, 'another account cannot');

-- Second run, on request: contrast is fixed, a new issue appears on /about,
-- and /contact fails again so its state is unknown.
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT isnt(public.request_site_scan((SELECT id FROM public.sites)), NULL, 'an owner asks for a scan');
SELECT throws_ok($$ SELECT public.request_site_scan((SELECT id FROM public.sites)) $$, 'P0001', 'SCAN_IN_PROGRESS', 'only one run at a time');
SELECT test_helpers.act_as('service_role', NULL);
SELECT is(
  test_helpers.work_queue('{"https://shop.example.com/": ["image-alt"], "https://shop.example.com/about": ["link-name"]}', ARRAY['https://shop.example.com/contact']),
  3,
  'the worker processes all three pages'
);
SELECT is(
  (SELECT new_issues || '/' || resolved_issues || '/' || open_issues FROM public.scan_runs WHERE trigger = 'manual'),
  '1/1/2',
  'the run counts new and resolved issues'
);
SELECT is((SELECT state FROM public.issues WHERE rule_id = 'color-contrast'), 'resolved', 'a rule that passes now is resolved');
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT throws_ok($$ SELECT public.request_site_scan((SELECT id FROM public.sites)) $$, 'P0001', 'SCAN_RATE_LIMIT', 'one requested scan a day');

-- Third run (scheduled): contrast comes back, image-alt was marked fixed and
-- is gone, link-name was marked fixed but still fails.
SELECT test_helpers.act_as_system();
UPDATE public.issues SET state = 'marked_fixed' WHERE rule_id IN ('image-alt', 'link-name');
UPDATE public.scan_runs SET created_at = now() - interval '8 days' WHERE trigger = 'initial';
SELECT is(public.enqueue_due_scans(), 1, 'a site is queued 7 days after its last scheduled scan');
SELECT is(public.enqueue_due_scans(), 0, 'and only once');
SELECT test_helpers.act_as('service_role', NULL);
SELECT test_helpers.work_queue('{"https://shop.example.com/": ["color-contrast"], "https://shop.example.com/about": ["link-name"], "https://shop.example.com/contact": []}');
SELECT is(
  (SELECT string_agg(rule_id || ':' || state, ',' ORDER BY rule_id) FROM public.issues),
  'color-contrast:open,image-alt:resolved,link-name:open',
  'issues follow the latest scan'
);
SELECT is(
  (SELECT string_agg(issues.rule_id || ':' || events.kind, ',' ORDER BY issues.rule_id)
   FROM public.issue_events AS events JOIN public.issues ON issues.id = events.issue_id
   WHERE events.run_id = (SELECT id FROM public.scan_runs WHERE trigger = 'scheduled')),
  'color-contrast:reopened,image-alt:fix_confirmed,link-name:fix_not_confirmed',
  'the history records reopened, confirmed and unconfirmed fixes'
);
SELECT is((SELECT new_issues FROM public.scan_runs WHERE trigger = 'scheduled'), 1, 'a reopened issue counts as new');

-- Removing a page
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c4');
SELECT throws_ok(
  $$ SELECT public.remove_site_page((SELECT id FROM public.site_pages WHERE url = 'https://shop.example.com/about')) $$,
  'P0001', 'NOT_FOUND', 'another account cannot remove a page'
);
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.remove_site_page((SELECT id FROM public.site_pages WHERE url = 'https://shop.example.com/about'));
SELECT test_helpers.act_as_system();
UPDATE public.scan_runs SET created_at = created_at - interval '8 days';
SELECT public.enqueue_due_scans();
SELECT is((SELECT pages_total FROM public.scan_runs WHERE status = 'queued'), 2, 'a removed page is not scanned');
SELECT is((SELECT count(*)::integer FROM public.issues WHERE rule_id = 'link-name'), 1, 'but its history stays');

-- A crashed worker
SELECT test_helpers.act_as('service_role', NULL);
SELECT is((SELECT count(*)::integer FROM public.claim_scan_pages(5)), 2, 'the worker claims the pages');
SELECT test_helpers.act_as_system();
UPDATE public.scan_page_results SET claimed_at = now() - interval '5 minutes' WHERE status = 'running';
UPDATE public.scan_page_results SET attempts = 3 WHERE status = 'running' AND url = 'https://shop.example.com/contact';
SELECT test_helpers.act_as('service_role', NULL);
SELECT is((SELECT url FROM public.claim_scan_pages(5)), 'https://shop.example.com/', 'a page left running is retried');
SELECT is((SELECT error_code FROM public.scan_page_results WHERE url = 'https://shop.example.com/contact' AND run_id = (SELECT id FROM public.scan_runs WHERE status = 'running')), 'worker_timeout', 'after three attempts it fails');
SELECT public.complete_scan_page((SELECT id FROM public.scan_page_results WHERE status = 'running'), 95, '[]');
SELECT is((SELECT count(*)::integer FROM public.scan_runs WHERE status <> 'completed'), 0, 'and the run still completes');

-- Pausing and losing access
SELECT test_helpers.act_as('authenticated', '00000000-0000-0000-0000-0000000000c3');
SELECT public.set_site_paused((SELECT id FROM public.sites), true);
SELECT test_helpers.act_as_system();
UPDATE public.scan_runs SET created_at = created_at - interval '30 days';
SELECT is(public.enqueue_due_scans(), 0, 'a paused site is not scanned');
UPDATE public.sites SET paused = false;
DELETE FROM public.monitor_allowlist WHERE user_id = '00000000-0000-0000-0000-0000000000c3';
SELECT is(public.enqueue_due_scans(), 0, 'nor is a site whose owner lost access');

-- History cannot be rewritten
SELECT throws_ok($$ UPDATE public.issue_events SET kind = 'resolved' $$, 'P0001', 'issue events are append-only', 'issue events are append-only');

-- No Vault secrets, no requests
INSERT INTO public.monitor_allowlist (user_id) VALUES ('00000000-0000-0000-0000-0000000000c3');
SELECT public.enqueue_due_scans();
SELECT is(public.kick_scan_worker(), NULL, 'the worker is not called until its secrets exist');

-- Deleting the account deletes everything, including events it authored
INSERT INTO public.issue_events (issue_id, site_id, kind, actor_id)
SELECT id, site_id, 'marked_fixed', '00000000-0000-0000-0000-0000000000c3' FROM public.issues LIMIT 1;
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000c3';
SELECT is(
  (SELECT count(*)::integer FROM public.sites) + (SELECT count(*)::integer FROM public.scan_runs) + (SELECT count(*)::integer FROM public.issues) + (SELECT count(*)::integer FROM public.issue_events),
  0,
  'deleting an account deletes its sites, runs, issues and history'
);

SELECT * FROM finish();
ROLLBACK;
