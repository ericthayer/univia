/*
  Plan allowances, raised. Decided by the owner on 2026-11-25.

  Before (20261108050610_enforce_plan_limits):
    Audits: Free 1 a month, Monitor 30 a month, Agency no cap
    Letters: Free 1 in total, Monitor 5 a month, Agency no cap
  After:
    Audits: no cap for anyone, guests included
    Letters: Free 5 per calendar month (UTC), Monitor and Agency no cap

  Guests (anonymous sessions, which have no profile) keep 1 letter in total,
  so letters are what a free account unlocks. Active admins have no cap, as
  before.

  Audit runs are still claimed in audit_quota_claims, so Account Settings keeps
  showing usage. Bringing a cap back takes more than changing
  plan_audit_limit(): audit_limit_for() reads the stored audit_limit, so the
  column default and existing profiles must be changed too (see Reversal).

  Profiles still holding their plan's old audit limit (Free 1, Monitor 30) move
  to no cap. Any other value was set on purpose by an admin, so leave it.

  Reversal: restore plan_audit_limit(), audit_limit_for() and letter_quota() from
  20261108050610, set audit_limit's default back to 1, and set profiles with
  audit_limit = -1 back to plan_audit_limit(tier).
*/

-- 1. Audits -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.plan_audit_limit(p_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT -1
$$;

REVOKE ALL ON FUNCTION public.plan_audit_limit(text) FROM PUBLIC, anon, authenticated;

-- Same as 20261108050610, except callers without a profile (guests) have no
-- cap instead of 1. -1 means no cap.
CREATE OR REPLACE FUNCTION public.audit_limit_for(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN profiles.id IS NULL THEN -1
    WHEN profiles.is_admin AND profiles.status = 'active' THEN -1
    ELSE profiles.audit_limit
  END
  FROM (SELECT p_user_id AS id) AS caller
  LEFT JOIN public.user_profiles AS profiles ON profiles.id = caller.id
$$;

REVOKE ALL ON FUNCTION public.audit_limit_for(uuid) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.user_profiles ALTER COLUMN audit_limit SET DEFAULT -1;

UPDATE public.user_profiles
SET audit_limit = -1
WHERE (tier = 'basic' AND audit_limit = 1)
   OR (tier = 'pro' AND audit_limit = 30);

-- 2. Letters ------------------------------------------------------------------

-- Same as 20261108050610, except Free accounts get 5 a month instead of 1 in
-- total, and Monitor has no cap. Guests keep 1 in total.
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
    v_period := 'total';
  END IF;

  SELECT count(*)::integer INTO v_used
  FROM public.demand_letters
  WHERE user_id = p_user_id
    AND (v_period = 'total' OR created_at >= public.quota_period_start());

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
