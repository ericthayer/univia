/*
  Monitor fix tracker (Phase 5, slice B).

  Owners can mark an open issue fixed, undo that, and ask for a one-page
  re-check so the next scan of that page confirms the fix or not. The diffing
  in finalize_scan_run already records fix_confirmed / fix_not_confirmed; a
  re-check is an ordinary run that covers one page.

  - issue_events gains 'unmarked_fixed' (the owner takes back a mark).
  - scan_runs gains the 'recheck' trigger. Re-checks do not count as weekly
    scans and are capped at 10 per site per day.
  - create_scan_run takes an optional page, so a run can cover one page.
*/

-- 1. New event kind and run trigger ------------------------------------------------

ALTER TABLE public.issue_events DROP CONSTRAINT IF EXISTS issue_events_kind_check;
ALTER TABLE public.issue_events ADD CONSTRAINT issue_events_kind_check CHECK (kind IN (
  'detected',
  'reopened',
  'resolved',
  'marked_fixed',
  'unmarked_fixed',    -- the owner takes back a mark before a scan checks it
  'fix_confirmed',
  'fix_not_confirmed'
));

ALTER TABLE public.scan_runs DROP CONSTRAINT IF EXISTS scan_runs_trigger_check;
ALTER TABLE public.scan_runs ADD CONSTRAINT scan_runs_trigger_check
  CHECK (trigger IN ('initial', 'scheduled', 'manual', 'recheck'));

-- 2. Runs can cover one page --------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_scan_run(uuid, text);

-- Queues a run with one pending row per active page, or for p_page_id only.
-- Returns NULL when there is nothing to scan or the site already has an
-- unfinished run.
CREATE OR REPLACE FUNCTION public.create_scan_run(p_site_id uuid, p_trigger text, p_page_id uuid DEFAULT NULL)
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
  WHERE pages.site_id = p_site_id
    AND pages.removed_at IS NULL
    AND (p_page_id IS NULL OR pages.id = p_page_id);
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

REVOKE ALL ON FUNCTION public.create_scan_run(uuid, text, uuid) FROM PUBLIC, anon, authenticated;

-- 3. Owner actions ------------------------------------------------------------------

-- Locks and returns the caller's issue on an active page, or raises NOT_FOUND.
CREATE OR REPLACE FUNCTION public.owned_issue_for_update(p_issue_id uuid)
RETURNS public.issues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue public.issues%ROWTYPE;
BEGIN
  IF NOT public.monitor_enabled_for(auth.uid()) THEN
    RAISE EXCEPTION 'MONITOR_NOT_ENABLED';
  END IF;

  SELECT issues.* INTO v_issue
  FROM public.issues
  JOIN public.sites ON sites.id = issues.site_id
  JOIN public.site_pages AS pages ON pages.id = issues.page_id
  WHERE issues.id = p_issue_id
    AND sites.owner_id = auth.uid()
    AND pages.removed_at IS NULL
  FOR UPDATE OF issues;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  RETURN v_issue;
END;
$$;

REVOKE ALL ON FUNCTION public.owned_issue_for_update(uuid) FROM PUBLIC, anon, authenticated;

-- The owner says an open issue is fixed. The next scan of its page confirms
-- it (fix_confirmed) or reopens it (fix_not_confirmed). Not while a scan is
-- queued or running: that scan may already hold results from before the fix,
-- and finalizing it would judge the mark on them.
CREATE OR REPLACE FUNCTION public.mark_issue_fixed(p_issue_id uuid, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue public.issues%ROWTYPE;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
BEGIN
  -- Lock the site first, as create_scan_run does, so no run can start
  -- between the check below and the mark.
  PERFORM 1 FROM public.sites
  WHERE id = (SELECT site_id FROM public.issues WHERE id = p_issue_id)
  FOR UPDATE;

  v_issue := public.owned_issue_for_update(p_issue_id);
  IF v_issue.state <> 'open' THEN
    RAISE EXCEPTION 'INVALID_STATE';
  END IF;
  IF char_length(v_note) > 1000 THEN
    RAISE EXCEPTION 'NOTE_TOO_LONG';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.scan_runs
    WHERE site_id = v_issue.site_id AND status IN ('queued', 'running')
  ) THEN
    RAISE EXCEPTION 'SCAN_IN_PROGRESS';
  END IF;

  UPDATE public.issues SET state = 'marked_fixed' WHERE id = v_issue.id;
  INSERT INTO public.issue_events (issue_id, site_id, kind, actor_id, note)
  VALUES (v_issue.id, v_issue.site_id, 'marked_fixed', auth.uid(), v_note);
END;
$$;

-- Takes back a mark that no scan has checked yet.
CREATE OR REPLACE FUNCTION public.undo_mark_fixed(p_issue_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue public.issues%ROWTYPE := public.owned_issue_for_update(p_issue_id);
BEGIN
  IF v_issue.state <> 'marked_fixed' THEN
    RAISE EXCEPTION 'INVALID_STATE';
  END IF;

  UPDATE public.issues SET state = 'open' WHERE id = v_issue.id;
  INSERT INTO public.issue_events (issue_id, site_id, kind, actor_id)
  VALUES (v_issue.id, v_issue.site_id, 'unmarked_fixed', auth.uid());
END;
$$;

-- Scans one page now, so a marked fix is checked without waiting for the
-- weekly scan. At most 10 per site per day; never alongside another run.
CREATE OR REPLACE FUNCTION public.request_page_recheck(p_page_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_id uuid;
  v_run_id uuid;
BEGIN
  IF NOT public.monitor_enabled_for(auth.uid()) THEN
    RAISE EXCEPTION 'MONITOR_NOT_ENABLED';
  END IF;

  SELECT sites.id INTO v_site_id
  FROM public.sites
  JOIN public.site_pages AS pages ON pages.site_id = sites.id
  WHERE pages.id = p_page_id
    AND pages.removed_at IS NULL
    AND sites.owner_id = auth.uid()
  FOR UPDATE OF sites;

  IF v_site_id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.scan_runs
    WHERE site_id = v_site_id AND status IN ('queued', 'running')
  ) THEN
    RAISE EXCEPTION 'SCAN_IN_PROGRESS';
  END IF;

  IF (
    SELECT count(*) FROM public.scan_runs
    WHERE site_id = v_site_id AND trigger = 'recheck' AND created_at > now() - interval '1 day'
  ) >= 10 THEN
    RAISE EXCEPTION 'RECHECK_RATE_LIMIT';
  END IF;

  v_run_id := public.create_scan_run(v_site_id, 'recheck', p_page_id);
  IF v_run_id IS NULL THEN
    RAISE EXCEPTION 'NO_PAGES';
  END IF;

  RETURN v_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_issue_fixed(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.undo_mark_fixed(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_page_recheck(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_issue_fixed(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.undo_mark_fixed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_page_recheck(uuid) TO authenticated;
