/*
  Plan limits, enforced on the server. See docs/specs/monitor-launch/SPEC.md,
  Phase 2, and Decisions 8 and 9.

  Audits (one audit = one mobile + desktop run), per calendar month in UTC:
    guests and accounts without a profile: 1
    profiles: user_profiles.audit_limit (Free 1, Monitor 30, Agency -1 = no cap)
    active admins: no cap

  Demand letters:
    guests and Free: 1 in total
    Monitor: 5 per calendar month in UTC
    Agency and active admins: no cap

  run-lighthouse-audit claims a run before calling PageSpeed and releases it
  if both devices fail, so failed audits do not use the allowance.
  insert_demand_letter() checks the letter allowance under the same per-user
  lock it already took for guests.

  Reversal: restore insert_demand_letter() from 20261101120000, drop the
  functions, table and trigger below, and set audit_limit's default back to 20.
*/

-- 1. Audit limits follow the plan ------------------------------------------

CREATE OR REPLACE FUNCTION public.plan_audit_limit(p_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_tier
    WHEN 'pro' THEN 30
    WHEN 'enterprise' THEN -1
    ELSE 1
  END
$$;

ALTER TABLE public.user_profiles ALTER COLUMN audit_limit SET DEFAULT 1;

-- 20 was the column's old default, never a plan. Any other value was set on
-- purpose by an admin, so leave it.
UPDATE public.user_profiles
SET audit_limit = public.plan_audit_limit(tier)
WHERE audit_limit = 20;

-- A plan change resets the limit to that plan's, unless the same update sets
-- the limit explicitly.
-- SECURITY DEFINER because admins change plans from the browser, and the
-- helper it calls is closed to browser roles.
CREATE OR REPLACE FUNCTION public.sync_audit_limit_with_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tier IS DISTINCT FROM OLD.tier
    AND NEW.audit_limit IS NOT DISTINCT FROM OLD.audit_limit THEN
    NEW.audit_limit := public.plan_audit_limit(NEW.tier);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_audit_limit_with_tier ON public.user_profiles;
CREATE TRIGGER sync_audit_limit_with_tier
  BEFORE UPDATE OF tier ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_audit_limit_with_tier();

REVOKE ALL ON FUNCTION public.sync_audit_limit_with_tier() FROM PUBLIC, anon, authenticated;

-- 2. Shared helpers -----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.quota_period_start()
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
$$;

-- -1 means no cap.
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

REVOKE ALL ON FUNCTION public.plan_audit_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.quota_period_start() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_limit_for(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Audit runs ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_quota_claims (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_quota_claims_user_created
  ON public.audit_quota_claims (user_id, created_at);

-- Written and read only through the functions below.
ALTER TABLE public.audit_quota_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_quota_claims FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_audit_run(p_user_id uuid, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_used integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'audit quota requires service role';
  END IF;

  IF p_user_id IS NULL OR p_session_id IS NULL THEN
    RAISE EXCEPTION 'audit quota needs a user and a session';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('audit_quota:' || p_user_id::text, 0));

  v_limit := public.audit_limit_for(p_user_id);
  SELECT count(*)::integer INTO v_used
  FROM public.audit_quota_claims
  WHERE user_id = p_user_id
    AND created_at >= public.quota_period_start();

  IF v_limit >= 0 AND v_used >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'limit', v_limit, 'used', v_used, 'period', 'month');
  END IF;

  INSERT INTO public.audit_quota_claims (session_id, user_id)
  VALUES (p_session_id, p_user_id);

  RETURN jsonb_build_object('allowed', true, 'limit', v_limit, 'used', v_used + 1, 'period', 'month');
END;
$$;

CREATE OR REPLACE FUNCTION public.release_audit_run(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'audit quota requires service role';
  END IF;

  DELETE FROM public.audit_quota_claims WHERE session_id = p_session_id;
END;
$$;

-- What the signed-in caller has used this month, for Account Settings.
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
        AND created_at >= public.quota_period_start()
    ),
    'period', 'month'
  )
  WHERE auth.uid() IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.claim_audit_run(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_audit_run(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.my_audit_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_audit_run(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_audit_run(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.my_audit_usage() TO authenticated;

-- 4. Demand letters -----------------------------------------------------------

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

  IF NOT v_anonymous AND ((v_is_admin AND v_status = 'active') OR v_tier = 'enterprise') THEN
    RETURN jsonb_build_object('allowed', true, 'limit', -1, 'used', 0, 'period', 'none', 'anonymous', false);
  ELSIF NOT v_anonymous AND v_tier = 'pro' THEN
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

-- Same as 20261101120000, except the allowance now covers every caller, not
-- only guests. p_is_anonymous stays for callers but is no longer trusted:
-- letter_quota() reads it from auth.users.
CREATE OR REPLACE FUNCTION public.insert_demand_letter(
  p_user_id uuid,
  p_is_anonymous boolean,
  p_letter jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_id uuid;
  v_quota jsonb;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'demand letter persistence requires service role';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'demand letter owner is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  v_quota := public.letter_quota(p_user_id);
  IF NOT (v_quota->>'allowed')::boolean THEN
    IF (v_quota->>'anonymous')::boolean THEN
      RAISE EXCEPTION 'ANONYMOUS_LETTER_LIMIT';
    END IF;
    RAISE EXCEPTION 'LETTER_LIMIT';
  END IF;

  INSERT INTO public.demand_letters (
    business_id,
    user_id,
    file_name,
    file_size,
    upload_date,
    plaintiff_name,
    attorney_name,
    attorney_firm,
    response_deadline,
    settlement_amount,
    violations_cited,
    extracted_text,
    analysis_summary,
    risk_level,
    status,
    confidence_scores,
    extracted_entities,
    ai_model_version,
    processing_status,
    analysis_result
  ) VALUES (
    NULLIF(p_letter->>'business_id', '')::uuid,
    p_user_id,
    p_letter->>'file_name',
    NULLIF(p_letter->>'file_size', '')::integer,
    COALESCE(NULLIF(p_letter->>'upload_date', '')::timestamptz, now()),
    NULLIF(p_letter->>'plaintiff_name', ''),
    NULLIF(p_letter->>'attorney_name', ''),
    NULLIF(p_letter->>'attorney_firm', ''),
    NULLIF(p_letter->>'response_deadline', '')::date,
    NULLIF(p_letter->>'settlement_amount', '')::numeric,
    p_letter->'violations_cited',
    NULLIF(p_letter->>'extracted_text', ''),
    p_letter->>'analysis_summary',
    p_letter->>'risk_level',
    p_letter->>'status',
    COALESCE(p_letter->'confidence_scores', '{}'::jsonb),
    COALESCE(p_letter->'extracted_entities', '{}'::jsonb),
    p_letter->>'ai_model_version',
    p_letter->>'processing_status',
    CASE
      WHEN jsonb_typeof(p_letter->'analysis_result') = 'object' THEN p_letter->'analysis_result'
      ELSE NULL
    END
  )
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_demand_letter(uuid, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_demand_letter(uuid, boolean, jsonb) TO service_role;
