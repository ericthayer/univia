/*
  Accessibility Remediation Record (Phase 5, slice C).

  An owner picks a period and gets a printable record of the scans that
  finished in it and every change to the site's issues up to its end. Each
  record is saved with a SHA-256 fingerprint of that history, so anyone with
  the record's link can check later that the history it describes has not
  changed since.

  - What the fingerprint covers: every issue_events row of the site created
    before the period ends, and every scan run that finished before the period
    ends, serialized in a fixed order and format. issue_events is append-only
    and finished runs are not updated, so the fingerprint stays the same unless
    history is altered or removed.
  - The period end is never later than the moment the record is made, so later
    events cannot change it.
  - Records are owner-readable rows; only the functions below create them.
  - verify_remediation_record is public. It reveals a record's site, period and
    fingerprint to whoever has its id (a random UUID printed on the record),
    and nothing else.
  - The name is a working title until the attorney review (Decision 6). It
    makes no compliance claim.
*/

-- 1. Table -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.remediation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  run_count integer NOT NULL,
  event_count integer NOT NULL,
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end > period_start)
);

CREATE INDEX IF NOT EXISTS remediation_records_site_idx ON public.remediation_records (site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS remediation_records_owner_idx ON public.remediation_records (owner_id);

ALTER TABLE public.remediation_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.remediation_records FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.remediation_records TO authenticated;

DROP POLICY IF EXISTS "Owners read their records" ON public.remediation_records;
CREATE POLICY "Owners read their records" ON public.remediation_records
  FOR SELECT TO authenticated
  USING (owner_id = (select auth.uid()));

-- 2. Fingerprint -------------------------------------------------------------------

-- Fixed UTC format with microseconds, so the same instant always serializes
-- the same way whatever the session time zone.
CREATE OR REPLACE FUNCTION public.record_ts(p_value timestamptz)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN p_value IS NULL THEN '' ELSE to_char(p_value AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') END;
$$;

REVOKE ALL ON FUNCTION public.record_ts(timestamptz) FROM PUBLIC, anon, authenticated;

-- One line per finished run (oldest first), a record separator, then one line
-- per event (by id). Fields are joined with U+001F.
CREATE OR REPLACE FUNCTION public.record_fingerprint(p_site_id uuid, p_period_end timestamptz)
RETURNS TABLE (run_count integer, event_count integer, fingerprint text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH runs AS (
    SELECT concat_ws(chr(31),
      'run', id::text, trigger, status, pages_total, pages_succeeded, pages_failed,
      new_issues, resolved_issues, public.record_ts(completed_at)
    ) AS line, completed_at AS ordered_at, id::text AS tiebreak
    FROM public.scan_runs
    WHERE site_id = p_site_id
      AND status IN ('completed', 'failed')
      AND completed_at < p_period_end
  ),
  events AS (
    SELECT concat_ws(chr(31),
      'event', id::text, issue_id::text, coalesce(run_id::text, ''), kind,
      coalesce(note, ''), public.record_ts(created_at)
    ) AS line, id
    FROM public.issue_events
    WHERE site_id = p_site_id
      AND created_at < p_period_end
  )
  SELECT
    (SELECT count(*)::integer FROM runs),
    (SELECT count(*)::integer FROM events),
    encode(extensions.digest(convert_to(
      coalesce((SELECT string_agg(line, chr(10) ORDER BY ordered_at, tiebreak) FROM runs), '')
      || chr(30) ||
      coalesce((SELECT string_agg(line, chr(10) ORDER BY id) FROM events), ''),
      'UTF8'), 'sha256'), 'hex');
$$;

REVOKE ALL ON FUNCTION public.record_fingerprint(uuid, timestamptz) FROM PUBLIC, anon, authenticated;

-- 3. Record contents --------------------------------------------------------------

-- The history a record covers, for printing: exactly the runs and events its
-- fingerprint was computed over, plus the issues they refer to and the site.
-- Owners only. Printing an older record again shows the same history.
CREATE OR REPLACE FUNCTION public.remediation_record_contents(p_record_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.remediation_records%ROWTYPE;
BEGIN
  SELECT * INTO v_record
  FROM public.remediation_records
  WHERE id = p_record_id AND owner_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object(
    'record', to_jsonb(v_record),
    'site', (SELECT jsonb_build_object('name', name, 'origin', origin) FROM public.sites WHERE id = v_record.site_id),
    'runs', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id, 'trigger', trigger, 'status', status, 'pages_total', pages_total,
        'pages_succeeded', pages_succeeded, 'pages_failed', pages_failed,
        'new_issues', new_issues, 'resolved_issues', resolved_issues,
        'created_at', created_at, 'completed_at', completed_at
      ) ORDER BY completed_at, id)
      FROM public.scan_runs
      WHERE site_id = v_record.site_id AND status IN ('completed', 'failed') AND completed_at < v_record.period_end
    ), '[]'::jsonb),
    'events', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', events.id, 'issue_id', events.issue_id, 'run_id', events.run_id,
        'kind', events.kind, 'note', events.note, 'created_at', events.created_at
      ) ORDER BY events.id)
      FROM public.issue_events AS events
      WHERE events.site_id = v_record.site_id AND events.created_at < v_record.period_end
    ), '[]'::jsonb),
    'issues', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', issues.id, 'rule_id', issues.rule_id, 'title', issues.title,
        'severity', issues.severity, 'page_url', pages.url
      ) ORDER BY issues.id)
      FROM public.issues AS issues
      JOIN public.site_pages AS pages ON pages.id = issues.page_id
      WHERE issues.site_id = v_record.site_id
        AND EXISTS (
          SELECT 1 FROM public.issue_events AS events
          WHERE events.issue_id = issues.id AND events.created_at < v_record.period_end
        )
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.remediation_record_contents(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remediation_record_contents(uuid) TO authenticated;

-- 4. Create a record ---------------------------------------------------------------

-- Saves a record for the caller's site and returns its contents.
CREATE OR REPLACE FUNCTION public.create_remediation_record(
  p_site_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_end timestamptz := least(p_period_end, now());
  v_print record;
  v_record_id uuid;
  v_recent integer;
BEGIN
  IF v_caller IS NULL OR NOT public.monitor_enabled_for(v_caller) THEN
    RAISE EXCEPTION 'MONITOR_NOT_ENABLED' USING ERRCODE = 'P0001';
  END IF;

  PERFORM 1 FROM public.sites WHERE id = p_site_id AND owner_id = v_caller FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_start >= v_end
     OR v_end - p_period_start > interval '367 days' THEN
    RAISE EXCEPTION 'INVALID_PERIOD' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.remediation_records
  WHERE site_id = p_site_id AND created_at > now() - interval '1 day';
  IF v_recent >= 20 THEN
    RAISE EXCEPTION 'RECORD_RATE_LIMIT' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_print FROM public.record_fingerprint(p_site_id, v_end);

  INSERT INTO public.remediation_records (site_id, owner_id, period_start, period_end, run_count, event_count, fingerprint)
  VALUES (p_site_id, v_caller, p_period_start, v_end, v_print.run_count, v_print.event_count, v_print.fingerprint)
  RETURNING id INTO v_record_id;

  RETURN public.remediation_record_contents(v_record_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_remediation_record(uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_remediation_record(uuid, timestamptz, timestamptz) TO authenticated;

-- 5. Verify a record ---------------------------------------------------------------

-- Anyone with a record's id can check it. 'matches' is false when the history
-- the record covers has changed since it was made.
CREATE OR REPLACE FUNCTION public.verify_remediation_record(p_record_id uuid)
RETURNS TABLE (
  site_name text,
  site_origin text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz,
  fingerprint text,
  matches boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sites.name,
    sites.origin,
    records.period_start,
    records.period_end,
    records.created_at,
    records.fingerprint,
    current.fingerprint = records.fingerprint
      AND current.run_count = records.run_count
      AND current.event_count = records.event_count
  FROM public.remediation_records AS records
  JOIN public.sites AS sites ON sites.id = records.site_id
  CROSS JOIN LATERAL public.record_fingerprint(records.site_id, records.period_end) AS current
  WHERE records.id = p_record_id;
$$;

REVOKE ALL ON FUNCTION public.verify_remediation_record(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_remediation_record(uuid) TO anon, authenticated;
