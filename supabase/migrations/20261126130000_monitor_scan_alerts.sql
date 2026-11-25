/*
  Monitor scan alerts (slice E).

  After a scan run completes with new, reopened or not-yet-fixed issues, one
  summary email is queued for the site's owner. The `send-alerts` Edge
  Function sends it through Resend. Owners can turn alerts off in Account
  Settings or with the one-click unsubscribe link in every email.

  - notification_settings: one row per account, created on first use. Alerts
    are on by default. The unsubscribe token is the only way to change
    settings without signing in.
  - email_outbox: one row per run (unique), written by a trigger on
    scan_runs, never by browsers. Doubles as the send queue.
  - kick_email_worker(): pg_cron calls it every minute. It wakes the
    function only when mail is waiting. It reuses the scan worker's Vault
    secrets: the URL is scan_worker_url with the function name swapped, and
    the shared secret is the same, so no new owner steps are needed.
*/

-- 1. Settings ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_alerts boolean NOT NULL DEFAULT true,
  unsubscribe_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT (user_id, scan_alerts, updated_at) ON public.notification_settings TO authenticated;

DROP POLICY IF EXISTS "Owners read their notification settings" ON public.notification_settings;
CREATE POLICY "Owners read their notification settings"
  ON public.notification_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Signed-in owners turn alerts on or off. Guests have no email, so no alerts.
CREATE OR REPLACE FUNCTION public.set_scan_alerts(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL OR coalesce((SELECT is_anonymous FROM auth.users WHERE id = v_user), true) THEN
    RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.notification_settings (user_id, scan_alerts)
  VALUES (v_user, p_enabled)
  ON CONFLICT (user_id) DO UPDATE SET scan_alerts = EXCLUDED.scan_alerts, updated_at = now();
  RETURN p_enabled;
END;
$$;

REVOKE ALL ON FUNCTION public.set_scan_alerts(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_scan_alerts(boolean) TO authenticated;

-- One-click unsubscribe, called only by the email-unsubscribe function.
-- Returns false for an unknown token without saying more.
CREATE OR REPLACE FUNCTION public.unsubscribe_scan_alerts(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_settings
  SET scan_alerts = false, updated_at = now()
  WHERE unsubscribe_token = p_token;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_scan_alerts(uuid) FROM PUBLIC, anon, authenticated;

-- 2. Outbox ------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  run_id uuid NOT NULL UNIQUE REFERENCES public.scan_runs(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'scan_alert' CHECK (kind IN ('scan_alert')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0,
  not_before timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  provider_id text CHECK (provider_id IS NULL OR char_length(provider_id) <= 200),
  last_error text CHECK (last_error IS NULL OR char_length(last_error) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_outbox_queue_idx
  ON public.email_outbox (not_before) WHERE status IN ('pending', 'sending');

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_outbox FROM PUBLIC, anon, authenticated;

-- Queues one alert when a run completes with something the owner should see:
-- a new issue, an issue that came back, or a fix the scan did not confirm.
CREATE OR REPLACE FUNCTION public.queue_scan_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.issue_events
    WHERE run_id = NEW.id AND kind IN ('detected', 'reopened', 'fix_not_confirmed')
  ) THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO v_owner FROM public.sites WHERE id = NEW.site_id;
  IF v_owner IS NULL
    OR NOT public.monitor_enabled_for(v_owner)
    OR EXISTS (SELECT 1 FROM public.notification_settings WHERE user_id = v_owner AND NOT scan_alerts)
  THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.email_outbox (user_id, site_id, run_id)
  VALUES (v_owner, NEW.site_id, NEW.id)
  ON CONFLICT (run_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_scan_alert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS scan_runs_queue_alert ON public.scan_runs;
CREATE TRIGGER scan_runs_queue_alert
  AFTER UPDATE OF status ON public.scan_runs
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.queue_scan_alert();

-- 3. Worker functions (service role only) -----------------------------------------

-- Claims up to p_limit emails and returns everything needed to send them.
-- A row left `sending` for 5 minutes is treated as a crashed worker. Rows
-- whose owner turned alerts off, or has no email, are skipped here.
CREATE OR REPLACE FUNCTION public.claim_email_outbox(p_limit integer DEFAULT 5)
RETURNS TABLE (outbox_id uuid, to_email text, payload jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.email_outbox%ROWTYPE;
  v_email text;
  v_token uuid;
BEGIN
  FOR v_row IN
    SELECT * FROM public.email_outbox
    WHERE (status = 'pending' AND not_before <= now())
       OR (status = 'sending' AND claimed_at < now() - interval '5 minutes')
    ORDER BY not_before
    LIMIT greatest(1, least(coalesce(p_limit, 5), 20))
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT users.email INTO v_email FROM auth.users AS users WHERE users.id = v_row.user_id;

    IF v_email IS NULL
      OR EXISTS (SELECT 1 FROM public.notification_settings WHERE user_id = v_row.user_id AND NOT scan_alerts)
      OR v_row.attempts >= 3
    THEN
      UPDATE public.email_outbox
      SET status = CASE WHEN v_row.attempts >= 3 THEN 'failed' ELSE 'skipped' END,
          last_error = coalesce(last_error, CASE
            WHEN v_row.attempts >= 3 THEN 'worker_crashed'
            WHEN v_email IS NULL THEN 'no_email'
            ELSE 'alerts_off'
          END)
      WHERE id = v_row.id;
      CONTINUE;
    END IF;

    INSERT INTO public.notification_settings (user_id) VALUES (v_row.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT unsubscribe_token INTO v_token FROM public.notification_settings WHERE user_id = v_row.user_id;

    UPDATE public.email_outbox
    SET status = 'sending', attempts = attempts + 1, claimed_at = now()
    WHERE id = v_row.id;

    outbox_id := v_row.id;
    to_email := v_email;
    payload := (
      SELECT jsonb_build_object(
        'site_id', sites.id,
        'site_name', sites.name,
        'origin', sites.origin,
        'trigger', runs.trigger,
        'completed_at', runs.completed_at,
        'pages_total', runs.pages_total,
        'pages_failed', runs.pages_failed,
        'open_issues', runs.open_issues,
        'resolved_issues', runs.resolved_issues,
        'unsubscribe_token', v_token,
        'events', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'kind', changes.kind,
            'title', changes.title,
            'severity', changes.severity,
            'url', changes.url
          ) ORDER BY changes.rank, changes.title)
          FROM (
            SELECT events.kind, issues.title, issues.severity, pages.url,
              CASE issues.severity WHEN 'critical' THEN 0 WHEN 'serious' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END AS rank
            FROM public.issue_events AS events
            JOIN public.issues AS issues ON issues.id = events.issue_id
            JOIN public.site_pages AS pages ON pages.id = issues.page_id
            WHERE events.run_id = runs.id
              AND events.kind IN ('detected', 'reopened', 'fix_not_confirmed')
          ) AS changes
        ), '[]'::jsonb)
      )
      FROM public.scan_runs AS runs
      JOIN public.sites AS sites ON sites.id = runs.site_id
      WHERE runs.id = v_row.run_id
    );
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_email_outbox(p_outbox_id uuid, p_provider_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.email_outbox
  SET status = 'sent', sent_at = now(), provider_id = left(p_provider_id, 200), last_error = NULL
  WHERE id = p_outbox_id AND status = 'sending';
$$;

-- A retryable failure waits 5, then 15 minutes; the third failure is final.
CREATE OR REPLACE FUNCTION public.fail_email_outbox(p_outbox_id uuid, p_error text, p_retry boolean)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.email_outbox
  SET status = CASE WHEN p_retry AND attempts < 3 THEN 'pending' ELSE 'failed' END,
      not_before = now() + CASE WHEN attempts <= 1 THEN interval '5 minutes' ELSE interval '15 minutes' END,
      last_error = left(p_error, 200)
  WHERE id = p_outbox_id AND status = 'sending';
$$;

REVOKE ALL ON FUNCTION public.claim_email_outbox(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_email_outbox(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_email_outbox(uuid, text, boolean) FROM PUBLIC, anon, authenticated;

-- 4. Scheduling --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kick_email_worker()
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
    SELECT 1 FROM public.email_outbox
    WHERE (status = 'pending' AND not_before <= now())
       OR (status = 'sending' AND claimed_at < now() - interval '5 minutes')
  ) THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'scan_worker_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'scan_worker_secret';
  IF v_url IS NULL OR v_secret IS NULL OR v_url !~ '/scan-worker$' THEN
    RETURN NULL;
  END IF;

  RETURN net.http_post(
    url := regexp_replace(v_url, '/scan-worker$', '/send-alerts'),
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-scan-worker-secret', v_secret),
    timeout_milliseconds := 60000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kick_email_worker() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('monitor-kick-email-worker', '* * * * *', 'SELECT public.kick_email_worker()');
