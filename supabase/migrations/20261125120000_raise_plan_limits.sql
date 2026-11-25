/*
  Plan allowances, raised. Decided by the owner on 2026-11-25.

  Before (20261108050610_enforce_plan_limits):
    Audits: guests 1 a month, Free 1 a month, Monitor 30 a month, Agency no cap
    Letters: guests and Free 1 in total, Monitor 5 a month, Agency no cap
  After:
    Guests (anonymous sessions, which have no profile): 1 audit and 1 letter
      per calendar week (Monday 00:00 UTC)
    Free: no audit cap, 5 letters per calendar month (UTC)
    Monitor and Agency: no audit cap, no letter cap
    Active admins: no cap, as before

  A free account is what unlocks unlimited audits.

  Audit runs are still claimed in audit_quota_claims, so Account Settings keeps
  showing usage. Bringing a plan cap back takes more than changing
  plan_audit_limit(): audit_limit_for() reads the stored audit_limit, so the
  column default and existing profiles must be changed too (see Reversal).

  Profiles still holding their plan's old audit limit (Free 1, Monitor 30) move
  to no cap. Any other value was set on purpose by an admin, so leave it.

  Edge Functions: run-lighthouse-audit and analyze-document must be deployed
  with the matching _shared/plan-limits.ts (which accepts the 'week' period)
  BEFORE this migration runs. Older versions reject 'week' answers and would
  refuse every guest request.

  Reversal: restore plan_audit_limit(), audit_limit_for(), claim_audit_run(),
  my_audit_usage() and letter_quota() from 20261108050610, drop
  audit_quota_period() and quota_period_start(text), set audit_limit's default
  back to 1, and set profiles with audit_limit = -1 back to
  plan_audit_limit(tier) under the old function.
*/

-- 1. Plan audit limits ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.plan_audit_limit(p_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT -1
$$;

REVOKE ALL ON FUNCTION public.plan_audit_limit(text) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.user_profiles ALTER COLUMN audit_limit SET DEFAULT -1;

UPDATE public.user_profiles
SET audit_limit = -1
WHERE (tier = 'basic' AND audit_limit = 1)
   OR (tier = 'pro' AND audit_limit = 30);

-- 2. Periods ----------------------------------------------------------------------

-- Start of the current 'week' (Monday) or 'month', in UTC.
CREATE OR REPLACE FUNCTION public.quota_period_start(p_period text)
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT date_trunc(
    CASE WHEN p_period = 'week' THEN 'week' ELSE 'month' END,
    now() AT TIME ZONE 'UTC'
  ) AT TIME ZONE 'UTC'
$$;

-- Callers without a profile (guests) are counted per week; everyone else per month.
CREATE OR REPLACE FUNCTION public.audit_quota_period(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN 'month'
    ELSE 'week'
  END
$$;

REVOKE ALL ON FUNCTION public.quota_period_start(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_quota_period(uuid) FROM PUBLIC, anon, authenticated;

-- Unchanged from 20261108050610: guests 1, admins no cap, otherwise the profile's limit.
CREATE OR REPLACE FUNCTION public.audit_limit_for(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN profiles.id IS NULL THEN 1
    WHEN profiles.is_admin AND profiles.status = 'active' THEN -1
    ELSE profiles.audit_limit
  END
  FROM (SELECT p_user_id AS id) AS caller
  LEFT JOIN public.user_profiles AS profiles ON profiles.id = caller.id
$$;

REVOKE ALL ON FUNCTION public.audit_limit_for(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Audit runs ---------------------------------------------------------------------

-- Same as 20261108050610, except the window follows audit_quota_period() and
-- the answer says whether the caller is a guest.
CREATE OR REPLACE FUNCTION public.claim_audit_run(p_user_id uuid, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_used integer;
  v_period text;
  v_anonymous boolean;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'audit quota requires service role';
  END IF;

  IF p_user_id IS NULL OR p_session_id IS NULL THEN
    RAISE EXCEPTION 'audit quota needs a user and a session';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('audit_quota:' || p_user_id::text, 0));

  v_limit := public.audit_limit_for(p_user_id);
  v_period := public.audit_quota_period(p_user_id);
  v_anonymous := v_period = 'week';

  SELECT count(*)::integer INTO v_used
  FROM public.audit_quota_claims
  WHERE user_id = p_user_id
    AND created_at >= public.quota_period_start(v_period);

  IF v_limit >= 0 AND v_used >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'limit', v_limit, 'used', v_used, 'period', v_period, 'anonymous', v_anonymous);
  END IF;

  INSERT INTO public.audit_quota_claims (session_id, user_id)
  VALUES (p_session_id, p_user_id);

  RETURN jsonb_build_object('allowed', true, 'limit', v_limit, 'used', v_used + 1, 'period', v_period, 'anonymous', v_anonymous);
END;
$$;

CREATE OR REPLACE FUNCTION public.my_audit_usage()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'limit', public.audit_limit_for(auth.uid()),
    'used', (
      SELECT count(*)::integer
      FROM public.audit_quota_claims
      WHERE user_id = auth.uid()
        AND created_at >= public.quota_period_start(public.audit_quota_period(auth.uid()))
    ),
    'period', public.audit_quota_period(auth.uid())
  )
  WHERE auth.uid() IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.claim_audit_run(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.my_audit_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_audit_run(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.my_audit_usage() TO authenticated;

-- 4. Letters ------------------------------------------------------------------------

-- Same as 20261108050610, except guests get 1 a week instead of 1 in total,
-- Free gets 5 a month, and Monitor has no cap.
CREATE OR REPLACE FUNCTION public.letter_quota(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anonymous boolean;
  v_tier text;
  v_is_admin boolean;
  v_status text;
  v_limit integer;
  v_period text;
  v_used integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'letter quota requires service role';
  END IF;

  SELECT coalesce(users.is_anonymous, false) INTO v_anonymous
  FROM auth.users AS users
  WHERE users.id = p_user_id;
  v_anonymous := coalesce(v_anonymous, false);

  SELECT profiles.tier, profiles.is_admin, profiles.status
  INTO v_tier, v_is_admin, v_status
  FROM public.user_profiles AS profiles
  WHERE profiles.id = p_user_id;

  IF NOT v_anonymous AND ((v_is_admin AND v_status = 'active') OR v_tier IN ('pro', 'enterprise')) THEN
    RETURN jsonb_build_object('allowed', true, 'limit', -1, 'used', 0, 'period', 'none', 'anonymous', false);
  ELSIF NOT v_anonymous AND v_tier IS NOT NULL THEN
    v_limit := 5;
    v_period := 'month';
  ELSE
    v_limit := 1;
    v_period := 'week';
  END IF;

  SELECT count(*)::integer INTO v_used
  FROM public.demand_letters
  WHERE user_id = p_user_id
    AND created_at >= public.quota_period_start(v_period);

  RETURN jsonb_build_object(
    'allowed', v_used < v_limit,
    'limit', v_limit,
    'used', v_used,
    'period', v_period,
    'anonymous', v_anonymous
  );
END;
$$;

REVOKE ALL ON FUNCTION public.letter_quota(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.letter_quota(uuid) TO service_role;
