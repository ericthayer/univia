/*
  Monitor, Phase 3: sites, pages and scheduled scans.
  See docs/specs/monitor-launch/SPEC.md, Phase 3 and section 5.

  A site has up to 25 pages. Every 7 days a scan run is queued for it, with one
  pending row per page in scan_page_results, which doubles as the work queue.
  The scan-worker Edge Function claims pending pages with FOR UPDATE SKIP
  LOCKED, scans each one through PageSpeed (mobile, accessibility only), and
  reports the result back. When the last page of a run is done, the run is
  finalized and its findings are compared with the site's issues.

  An issue is one Lighthouse accessibility rule failing on one page. It is not
  tied to individual elements: element selectors are often not unique, so an
  element-level key would report false "new" issues between runs. Element
  examples are kept on the issue for display only.

  Issue states: open, marked_fixed (set by the owner in Phase 5), resolved.
  Every state change is written to issue_events, which is append-only and is
  the source for the remediation record.

  Access: during the invite stage only active admins and accounts on
  monitor_allowlist can create sites (SPEC section 7). Payment replaces the
  allow-list in Phase 6. Owners read their own rows through RLS. All writes go
  through the functions below, never through table grants.

  Scheduling: pg_cron runs enqueue_due_scans() hourly and kick_scan_worker()
  every minute. kick_scan_worker() posts to the worker only when there is work
  and only when the Vault holds both 'scan_worker_url' and
  'scan_worker_secret'. Until those secrets exist it does nothing.

  Reversal: unschedule the two cron jobs, drop the functions, then drop
  issue_events, issues, scan_page_results, scan_runs, site_pages, sites and
  monitor_allowlist. Leave pg_cron and pg_net installed.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1. Who may use Monitor --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.monitor_allowlist (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note text CHECK (note IS NULL OR char_length(note) <= 200),
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monitor_allowlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.monitor_allowlist FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.monitor_enabled_for(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_user_id IS NOT NULL
    AND NOT coalesce((SELECT users.is_anonymous FROM auth.users AS users WHERE users.id = p_user_id), true)
    AND (
      EXISTS (SELECT 1 FROM public.monitor_allowlist WHERE user_id = p_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = p_user_id AND is_admin AND status = 'active'
      )
    )
$$;

-- For the browser: can the signed-in caller use Monitor?
CREATE OR REPLACE FUNCTION public.my_monitor_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.monitor_enabled_for(auth.uid())
$$;

REVOKE ALL ON FUNCTION public.monitor_enabled_for(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.my_monitor_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_monitor_access() TO authenticated;

-- 2. Tables -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  -- Lower-case https origin with no path, port or trailing slash.
  origin text NOT NULL CHECK (
    char_length(origin) <= 261
    AND origin ~ '^https://[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    -- Same refusals as the worker's validateAuditUrl, so a site that can be
    -- added can be scanned: no IP literals (the last label needs a letter),
    -- no localhost names, no punycode.
    AND origin ~ '\.[a-z0-9-]*[a-z][a-z0-9-]*$'
    AND origin !~ '\.localhost$'
    AND origin !~ 'xn--'
  ),
  paused boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, origin)
);

-- Pages are removed by setting removed_at, so their history stays in the record.
CREATE TABLE IF NOT EXISTS public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  url text NOT NULL CHECK (char_length(url) <= 2048),
  created_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS site_pages_active_url_key
  ON public.site_pages (site_id, url) WHERE removed_at IS NULL;

CREATE TABLE IF NOT EXISTS public.scan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  trigger text NOT NULL CHECK (trigger IN ('initial', 'scheduled', 'manual')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  pages_total integer NOT NULL DEFAULT 0,
  pages_succeeded integer NOT NULL DEFAULT 0,
  pages_failed integer NOT NULL DEFAULT 0,
  new_issues integer NOT NULL DEFAULT 0,
  resolved_issues integer NOT NULL DEFAULT 0,
  open_issues integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS scan_runs_site_created_idx ON public.scan_runs (site_id, created_at DESC);
-- At most one unfinished run per site.
CREATE UNIQUE INDEX IF NOT EXISTS scan_runs_one_active_per_site
  ON public.scan_runs (site_id) WHERE status IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS public.scan_page_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.scan_runs(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.site_pages(id) ON DELETE CASCADE,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  -- A retried page waits before it can be claimed again (fail_scan_page).
  not_before timestamptz,
  claimed_at timestamptz,
  finished_at timestamptz,
  error_code text CHECK (error_code IS NULL OR char_length(error_code) <= 64),
  accessibility_score integer CHECK (accessibility_score IS NULL OR accessibility_score BETWEEN 0 AND 100),
  -- [{rule_id, title, severity, element_count, items: [{selector, snippet, label}]}]
  findings jsonb CHECK (findings IS NULL OR jsonb_typeof(findings) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, page_id)
);

CREATE INDEX IF NOT EXISTS scan_page_results_queue_idx
  ON public.scan_page_results (created_at) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS scan_page_results_site_idx ON public.scan_page_results (site_id);
CREATE INDEX IF NOT EXISTS scan_page_results_page_idx ON public.scan_page_results (page_id);

CREATE TABLE IF NOT EXISTS public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.site_pages(id) ON DELETE CASCADE,
  rule_id text NOT NULL CHECK (char_length(rule_id) <= 100),
  title text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'serious', 'moderate', 'minor')),
  element_count integer NOT NULL DEFAULT 0,
  sample_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'marked_fixed', 'resolved')),
  first_seen_run_id uuid REFERENCES public.scan_runs(id) ON DELETE SET NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_run_id uuid REFERENCES public.scan_runs(id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (page_id, rule_id)
);

CREATE INDEX IF NOT EXISTS issues_site_state_idx ON public.issues (site_id, state);

CREATE TABLE IF NOT EXISTS public.issue_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  -- No ON DELETE actions here: an action would update rows the trigger below
  -- keeps immutable. Runs and actors go only when the whole site goes.
  run_id uuid REFERENCES public.scan_runs(id),
  kind text NOT NULL CHECK (kind IN (
    'detected',          -- first seen by a scan
    'reopened',          -- failing again after a scan resolved it
    'resolved',          -- a scan no longer finds it
    'marked_fixed',      -- the owner says it is fixed (Phase 5)
    'fix_confirmed',     -- a scan no longer finds an issue the owner marked fixed
    'fix_not_confirmed'  -- a scan still finds an issue the owner marked fixed
  )),
  actor_id uuid,
  note text CHECK (note IS NULL OR char_length(note) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS issue_events_issue_idx ON public.issue_events (issue_id, created_at);
CREATE INDEX IF NOT EXISTS issue_events_site_idx ON public.issue_events (site_id, created_at);

-- History is never rewritten. Deletes happen only by cascade from the site
-- or account, and no browser role has a delete grant.
CREATE OR REPLACE FUNCTION public.prevent_issue_event_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'issue events are append-only';
END;
$$;

DROP TRIGGER IF EXISTS issue_events_append_only ON public.issue_events;
CREATE TRIGGER issue_events_append_only
  BEFORE UPDATE ON public.issue_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_issue_event_update();

REVOKE ALL ON FUNCTION public.prevent_issue_event_update() FROM PUBLIC, anon, authenticated;

-- 3. Access: owners read, nobody writes directly ---------------------------------

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_page_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.sites, public.site_pages, public.scan_runs, public.scan_page_results,
  public.issues, public.issue_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sites, public.site_pages, public.scan_runs, public.scan_page_results,
  public.issues, public.issue_events TO authenticated;

DROP POLICY IF EXISTS "Owners read their sites" ON public.sites;
CREATE POLICY "Owners read their sites" ON public.sites
  FOR SELECT TO authenticated
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Owners read their site pages" ON public.site_pages;
CREATE POLICY "Owners read their site pages" ON public.site_pages
  FOR SELECT TO authenticated
  USING (site_id IN (SELECT id FROM public.sites WHERE owner_id = (select auth.uid())));

DROP POLICY IF EXISTS "Owners read their scan runs" ON public.scan_runs;
CREATE POLICY "Owners read their scan runs" ON public.scan_runs
  FOR SELECT TO authenticated
  USING (site_id IN (SELECT id FROM public.sites WHERE owner_id = (select auth.uid())));

DROP POLICY IF EXISTS "Owners read their page results" ON public.scan_page_results;
CREATE POLICY "Owners read their page results" ON public.scan_page_results
  FOR SELECT TO authenticated
  USING (site_id IN (SELECT id FROM public.sites WHERE owner_id = (select auth.uid())));

DROP POLICY IF EXISTS "Owners read their issues" ON public.issues;
CREATE POLICY "Owners read their issues" ON public.issues
  FOR SELECT TO authenticated
  USING (site_id IN (SELECT id FROM public.sites WHERE owner_id = (select auth.uid())));

DROP POLICY IF EXISTS "Owners read their issue history" ON public.issue_events;
CREATE POLICY "Owners read their issue history" ON public.issue_events
  FOR SELECT TO authenticated
  USING (site_id IN (SELECT id FROM public.sites WHERE owner_id = (select auth.uid())));

CREATE INDEX IF NOT EXISTS sites_owner_idx ON public.sites (owner_id);

-- 4. Validation helpers -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monitor_page_url_valid(p_origin text, p_url text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_url IS NOT NULL
    AND char_length(p_url) <= 2048
    AND (p_url = p_origin || '/' OR left(p_url, char_length(p_origin) + 1) = p_origin || '/')
    AND p_url !~ '[[:space:]#]'
$$;

REVOKE ALL ON FUNCTION public.monitor_page_url_valid(text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.monitor_page_limit()
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 25 $$;

REVOKE ALL ON FUNCTION public.monitor_page_limit() FROM PUBLIC, anon, authenticated;

-- 5. Runs ---------------------------------------------------------------------------

-- Queues a run with one pending row per active page. Returns NULL when the site
-- has no pages or already has an unfinished run.
CREATE OR REPLACE FUNCTION public.create_scan_run(p_site_id uuid, p_trigger text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
  v_pages integer;
BEGIN
  -- Page edits lock the same site row, so the pages cannot change under us.
  PERFORM 1 FROM public.sites WHERE id = p_site_id FOR UPDATE;

  INSERT INTO public.scan_runs (site_id, trigger)
  VALUES (p_site_id, p_trigger)
  ON CONFLICT (site_id) WHERE status IN ('queued', 'running') DO NOTHING
  RETURNING id INTO v_run_id;

  IF v_run_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.scan_page_results (run_id, site_id, page_id, url)
  SELECT v_run_id, p_site_id, pages.id, pages.url
  FROM public.site_pages AS pages
  WHERE pages.site_id = p_site_id AND pages.removed_at IS NULL;
  GET DIAGNOSTICS v_pages = ROW_COUNT;

  -- A run with no page rows could never finish and would block every later
  -- run through scan_runs_one_active_per_site, so never keep one.
  IF v_pages = 0 THEN
    DELETE FROM public.scan_runs WHERE id = v_run_id;
    RETURN NULL;
  END IF;

  UPDATE public.scan_runs SET pages_total = v_pages WHERE id = v_run_id;
  RETURN v_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_scan_run(uuid, text) FROM PUBLIC, anon, authenticated;

-- Hourly. Queues a run for every active site whose last scheduled or initial
-- run is at least 7 days old.
CREATE OR REPLACE FUNCTION public.enqueue_due_scans()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site record;
  v_count integer := 0;
BEGIN
  FOR v_site IN
    SELECT sites.id
    FROM public.sites
    WHERE NOT sites.paused
      AND public.monitor_enabled_for(sites.owner_id)
      AND coalesce((
        SELECT max(runs.created_at)
        FROM public.scan_runs AS runs
        WHERE runs.site_id = sites.id AND runs.trigger IN ('initial', 'scheduled')
      ), '-infinity'::timestamptz) <= now() - interval '7 days'
  LOOP
    IF public.create_scan_run(v_site.id, 'scheduled') IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_due_scans() FROM PUBLIC, anon, authenticated;

-- Compares a finished run's findings with the site's issues and records every
-- state change. Does nothing while any page of the run is unfinished.
CREATE OR REPLACE FUNCTION public.finalize_scan_run(p_run_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run public.scan_runs%ROWTYPE;
  v_result record;
  v_finding jsonb;
  v_issue public.issues%ROWTYPE;
  v_rules text[];
  v_new integer := 0;
  v_resolved integer := 0;
  v_succeeded integer;
  v_failed integer;
  v_severity text;
BEGIN
  SELECT * INTO v_run FROM public.scan_runs WHERE id = p_run_id FOR UPDATE;
  IF NOT FOUND OR v_run.status IN ('completed', 'failed') THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.scan_page_results
    WHERE run_id = p_run_id AND status IN ('pending', 'running')
  ) THEN
    RETURN;
  END IF;

  FOR v_result IN
    SELECT results.page_id, results.findings
    FROM public.scan_page_results AS results
    JOIN public.site_pages AS pages ON pages.id = results.page_id
    WHERE results.run_id = p_run_id
      AND results.status = 'succeeded'
      AND pages.removed_at IS NULL
  LOOP
    v_rules := ARRAY[]::text[];

    FOR v_finding IN SELECT value FROM jsonb_array_elements(coalesce(v_result.findings, '[]'::jsonb))
    LOOP
      CONTINUE WHEN coalesce(v_finding->>'rule_id', '') = '';
      v_rules := v_rules || (v_finding->>'rule_id');
      v_severity := CASE
        WHEN v_finding->>'severity' IN ('critical', 'serious', 'moderate', 'minor') THEN v_finding->>'severity'
        ELSE 'moderate'
      END;

      SELECT * INTO v_issue
      FROM public.issues
      WHERE page_id = v_result.page_id AND rule_id = v_finding->>'rule_id'
      FOR UPDATE;

      IF NOT FOUND THEN
        INSERT INTO public.issues (
          site_id, page_id, rule_id, title, severity, element_count, sample_items,
          state, first_seen_run_id, first_seen_at, last_seen_run_id, last_seen_at
        ) VALUES (
          v_run.site_id, v_result.page_id, v_finding->>'rule_id',
          left(coalesce(v_finding->>'title', v_finding->>'rule_id'), 500), v_severity,
          coalesce((v_finding->>'element_count')::integer, 0),
          coalesce(v_finding->'items', '[]'::jsonb),
          'open', p_run_id, now(), p_run_id, now()
        )
        RETURNING * INTO v_issue;

        INSERT INTO public.issue_events (issue_id, site_id, run_id, kind)
        VALUES (v_issue.id, v_run.site_id, p_run_id, 'detected');
        v_new := v_new + 1;
      ELSE
        IF v_issue.state = 'resolved' THEN
          INSERT INTO public.issue_events (issue_id, site_id, run_id, kind)
          VALUES (v_issue.id, v_run.site_id, p_run_id, 'reopened');
          v_new := v_new + 1;
        ELSIF v_issue.state = 'marked_fixed' THEN
          INSERT INTO public.issue_events (issue_id, site_id, run_id, kind)
          VALUES (v_issue.id, v_run.site_id, p_run_id, 'fix_not_confirmed');
        END IF;

        UPDATE public.issues SET
          title = left(coalesce(v_finding->>'title', title), 500),
          severity = v_severity,
          element_count = coalesce((v_finding->>'element_count')::integer, element_count),
          sample_items = coalesce(v_finding->'items', sample_items),
          state = 'open',
          resolved_at = NULL,
          last_seen_run_id = p_run_id,
          last_seen_at = now()
        WHERE id = v_issue.id;
      END IF;
    END LOOP;

    -- Anything still open on this page that the scan no longer finds is resolved.
    FOR v_issue IN
      SELECT * FROM public.issues
      WHERE page_id = v_result.page_id
        AND state IN ('open', 'marked_fixed')
        AND NOT (rule_id = ANY (v_rules))
      FOR UPDATE
    LOOP
      INSERT INTO public.issue_events (issue_id, site_id, run_id, kind)
      VALUES (
        v_issue.id, v_run.site_id, p_run_id,
        CASE WHEN v_issue.state = 'marked_fixed' THEN 'fix_confirmed' ELSE 'resolved' END
      );
      UPDATE public.issues SET state = 'resolved', resolved_at = now() WHERE id = v_issue.id;
      v_resolved := v_resolved + 1;
    END LOOP;
  END LOOP;

  SELECT
    count(*) FILTER (WHERE status = 'succeeded')::integer,
    count(*) FILTER (WHERE status = 'failed')::integer
  INTO v_succeeded, v_failed
  FROM public.scan_page_results
  WHERE run_id = p_run_id;

  UPDATE public.scan_runs SET
    status = CASE WHEN v_succeeded = 0 THEN 'failed' ELSE 'completed' END,
    pages_succeeded = v_succeeded,
    pages_failed = v_failed,
    new_issues = v_new,
    resolved_issues = v_resolved,
    open_issues = (
      SELECT count(*)::integer
      FROM public.issues AS issues
      JOIN public.site_pages AS pages ON pages.id = issues.page_id
      WHERE issues.site_id = v_run.site_id
        AND issues.state IN ('open', 'marked_fixed')
        AND pages.removed_at IS NULL
    ),
    started_at = coalesce(started_at, now()),
    completed_at = now()
  WHERE id = p_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_scan_run(uuid) FROM PUBLIC, anon, authenticated;

-- 6. Worker functions (service role only) -------------------------------------------

-- Claims up to p_limit pages. A page left running for over 4 minutes is
-- treated as a crashed worker: retried, or failed after its third attempt.
CREATE OR REPLACE FUNCTION public.claim_scan_pages(p_limit integer DEFAULT 1)
RETURNS TABLE (result_id uuid, run_id uuid, url text, attempts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_stale_run uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'scan queue requires service role';
  END IF;

  FOR v_stale_run IN
    WITH stale AS (
      UPDATE public.scan_page_results AS results SET
        status = CASE WHEN results.attempts >= 3 THEN 'failed' ELSE 'pending' END,
        error_code = CASE WHEN results.attempts >= 3 THEN 'worker_timeout' ELSE results.error_code END,
        finished_at = CASE WHEN results.attempts >= 3 THEN now() ELSE NULL END,
        claimed_at = NULL
      WHERE results.id IN (
        SELECT id FROM public.scan_page_results
        WHERE status = 'running' AND claimed_at < now() - interval '4 minutes'
        FOR UPDATE SKIP LOCKED
      )
      RETURNING results.run_id, results.status
    )
    SELECT DISTINCT stale.run_id FROM stale WHERE stale.status = 'failed'
  LOOP
    PERFORM public.finalize_scan_run(v_stale_run);
  END LOOP;

  RETURN QUERY
  WITH picked AS (
    SELECT id FROM public.scan_page_results
    WHERE status = 'pending' AND coalesce(not_before, '-infinity'::timestamptz) <= now()
    ORDER BY created_at, id
    LIMIT greatest(1, least(coalesce(p_limit, 1), 5))
    FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE public.scan_page_results AS results SET
      status = 'running',
      attempts = results.attempts + 1,
      not_before = NULL,
      claimed_at = now()
    FROM picked
    WHERE results.id = picked.id
    RETURNING results.id, results.run_id, results.url, results.attempts
  ), started AS (
    UPDATE public.scan_runs AS runs SET
      status = 'running',
      started_at = coalesce(runs.started_at, now())
    WHERE runs.id IN (SELECT claimed.run_id FROM claimed) AND runs.status = 'queued'
  )
  SELECT claimed.id, claimed.run_id, claimed.url, claimed.attempts FROM claimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_scan_page(
  p_result_id uuid,
  p_accessibility_score integer,
  p_findings jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'scan queue requires service role';
  END IF;

  IF jsonb_typeof(p_findings) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'findings must be an array';
  END IF;

  UPDATE public.scan_page_results SET
    status = 'succeeded',
    accessibility_score = p_accessibility_score,
    findings = p_findings,
    error_code = NULL,
    finished_at = now()
  WHERE id = p_result_id AND status = 'running'
  RETURNING run_id INTO v_run_id;

  IF v_run_id IS NOT NULL THEN
    PERFORM public.finalize_scan_run(v_run_id);
  END IF;
END;
$$;

-- p_retry: put the page back in the queue unless it has had three attempts.
CREATE OR REPLACE FUNCTION public.fail_scan_page(p_result_id uuid, p_error_code text, p_retry boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
  v_status text;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'scan queue requires service role';
  END IF;

  UPDATE public.scan_page_results SET
    status = CASE WHEN p_retry AND attempts < 3 THEN 'pending' ELSE 'failed' END,
    error_code = left(coalesce(p_error_code, 'internal_error'), 64),
    claimed_at = NULL,
    -- 5 minutes after the first attempt, 15 after the second, so a provider
    -- outage or rate limit is not retried into permanent failure in seconds.
    not_before = CASE WHEN p_retry AND attempts < 3 THEN now() + interval '5 minutes' * (2 * attempts - 1) END,
    finished_at = CASE WHEN p_retry AND attempts < 3 THEN NULL ELSE now() END
  WHERE id = p_result_id AND status = 'running'
  RETURNING run_id, status INTO v_run_id, v_status;

  IF v_status = 'failed' THEN
    PERFORM public.finalize_scan_run(v_run_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_scan_pages(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_scan_page(uuid, integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_scan_page(uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_scan_pages(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_scan_page(uuid, integer, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_scan_page(uuid, text, boolean) TO service_role;

-- 7. Browser functions (signed-in owners) -------------------------------------------

-- Adds pages to a site the caller owns, skipping duplicates. Raises PAGE_LIMIT
-- or INVALID_URL. Returns how many pages were added.
CREATE OR REPLACE FUNCTION public.add_site_pages_internal(p_site_id uuid, p_origin text, p_urls text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_active integer;
  v_added integer := 0;
BEGIN
  FOREACH v_url IN ARRAY coalesce(p_urls, ARRAY[]::text[])
  LOOP
    v_url := btrim(v_url);
    IF NOT public.monitor_page_url_valid(p_origin, v_url) THEN
      RAISE EXCEPTION 'INVALID_URL';
    END IF;

    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.site_pages
      WHERE site_id = p_site_id AND url = v_url AND removed_at IS NULL
    );

    SELECT count(*)::integer INTO v_active
    FROM public.site_pages
    WHERE site_id = p_site_id AND removed_at IS NULL;

    IF v_active >= public.monitor_page_limit() THEN
      RAISE EXCEPTION 'PAGE_LIMIT';
    END IF;

    INSERT INTO public.site_pages (site_id, url) VALUES (p_site_id, v_url);
    v_added := v_added + 1;
  END LOOP;

  RETURN v_added;
END;
$$;

REVOKE ALL ON FUNCTION public.add_site_pages_internal(uuid, text, text[]) FROM PUBLIC, anon, authenticated;

-- Creates the caller's site and queues its first scan. One site per account
-- during launch (SPEC section 3); active admins are not capped.
CREATE OR REPLACE FUNCTION public.create_site(p_name text, p_origin text, p_urls text[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_site_id uuid;
  v_origin text := lower(btrim(p_origin));
BEGIN
  IF NOT public.monitor_enabled_for(v_user) THEN
    RAISE EXCEPTION 'MONITOR_NOT_ENABLED';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('monitor_sites:' || v_user::text, 0));

  IF NOT public.univia_is_admin()
    AND EXISTS (SELECT 1 FROM public.sites WHERE owner_id = v_user) THEN
    RAISE EXCEPTION 'SITE_LIMIT';
  END IF;

  IF coalesce(array_length(p_urls, 1), 0) = 0 THEN
    RAISE EXCEPTION 'INVALID_URL';
  END IF;

  BEGIN
    INSERT INTO public.sites (owner_id, name, origin)
    VALUES (v_user, btrim(p_name), v_origin)
    RETURNING id INTO v_site_id;
  EXCEPTION
    WHEN check_violation THEN RAISE EXCEPTION 'INVALID_SITE';
    WHEN unique_violation THEN RAISE EXCEPTION 'SITE_EXISTS';
  END;

  PERFORM public.add_site_pages_internal(v_site_id, v_origin, p_urls);
  PERFORM public.create_scan_run(v_site_id, 'initial');

  RETURN v_site_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_site_pages(p_site_id uuid, p_urls text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_origin text;
BEGIN
  IF NOT public.monitor_enabled_for(auth.uid()) THEN
    RAISE EXCEPTION 'MONITOR_NOT_ENABLED';
  END IF;

  SELECT origin INTO v_origin
  FROM public.sites
  WHERE id = p_site_id AND owner_id = auth.uid()
  FOR UPDATE;

  IF v_origin IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  RETURN public.add_site_pages_internal(p_site_id, v_origin, p_urls);
END;
$$;

-- Stops scanning a page. Its issues and history stay for the record.
CREATE OR REPLACE FUNCTION public.remove_site_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Lock the site first, as create_scan_run does, so a run is never queued
  -- from a page list that is changing.
  PERFORM 1
  FROM public.sites
  JOIN public.site_pages AS pages ON pages.site_id = sites.id
  WHERE pages.id = p_page_id AND sites.owner_id = auth.uid()
  FOR UPDATE OF sites;

  UPDATE public.site_pages AS pages SET removed_at = now()
  FROM public.sites
  WHERE pages.id = p_page_id
    AND pages.removed_at IS NULL
    AND sites.id = pages.site_id
    AND sites.owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_site_paused(p_site_id uuid, p_paused boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sites SET paused = coalesce(p_paused, false), updated_at = now()
  WHERE id = p_site_id AND owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;
END;
$$;

-- A full re-scan on request, at most once a day per site.
CREATE OR REPLACE FUNCTION public.request_site_scan(p_site_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
BEGIN
  IF NOT public.monitor_enabled_for(auth.uid()) THEN
    RAISE EXCEPTION 'MONITOR_NOT_ENABLED';
  END IF;

  PERFORM 1 FROM public.sites WHERE id = p_site_id AND owner_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.scan_runs
    WHERE site_id = p_site_id AND status IN ('queued', 'running')
  ) THEN
    RAISE EXCEPTION 'SCAN_IN_PROGRESS';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.scan_runs
    WHERE site_id = p_site_id AND trigger = 'manual' AND created_at > now() - interval '1 day'
  ) THEN
    RAISE EXCEPTION 'SCAN_RATE_LIMIT';
  END IF;

  v_run_id := public.create_scan_run(p_site_id, 'manual');
  IF v_run_id IS NULL THEN
    RAISE EXCEPTION 'NO_PAGES';
  END IF;

  RETURN v_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_site(text, text, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_site_pages(uuid, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_site_page(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_site_paused(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_site_scan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_site(text, text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_site_pages(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_site_page(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_site_paused(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_site_scan(uuid) TO authenticated;

-- 8. Scheduling -------------------------------------------------------------------

-- Wakes the worker when pages are waiting. Needs two Vault secrets, created by
-- the owner outside git: 'scan_worker_url' (the function's URL) and
-- 'scan_worker_secret' (same value as the function's SCAN_WORKER_SECRET).
CREATE OR REPLACE FUNCTION public.kick_scan_worker()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.scan_page_results
    WHERE (status = 'pending' AND coalesce(not_before, '-infinity'::timestamptz) <= now())
       OR (status = 'running' AND claimed_at < now() - interval '4 minutes')
  ) THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'scan_worker_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'scan_worker_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RETURN NULL;
  END IF;

  -- The worker stops claiming new pages after about 40 seconds, so it answers
  -- well inside this timeout.
  RETURN net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-scan-worker-secret', v_secret),
    timeout_milliseconds := 150000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kick_scan_worker() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('monitor-enqueue-due-scans', '7 * * * *', 'SELECT public.enqueue_due_scans()');
SELECT cron.schedule('monitor-kick-scan-worker', '* * * * *', 'SELECT public.kick_scan_worker()');
