/*
  Private, revocable share links for demand-letter analyses.

  Spec: docs/specs/letter-sharing/SPEC.md

  1. demand_letters.analysis_result keeps the full AI analysis so a shared view
     can show key points, legal analysis, and recommended actions.
  2. shared_analysis_links is closed to anon/authenticated. Every read and write
     goes through the SECURITY DEFINER functions below.
  3. Tokens are 256-bit random values. Only their SHA-256 digest is stored.

  Self-contained on purpose: production has not applied
  20260208000000_harden_tenant_isolation, so this migration does not rely on
  user_owns_letter() or univia_is_admin(). Ownership is checked against
  demand_letters.user_id directly.
*/

-- 1. Persist the full analysis --------------------------------------------

ALTER TABLE public.demand_letters
  ADD COLUMN IF NOT EXISTS analysis_result jsonb;

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
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'demand letter persistence requires service role';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'demand letter owner is required';
  END IF;

  IF p_is_anonymous THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

    IF (
      SELECT count(*)
      FROM public.demand_letters
      WHERE user_id = p_user_id
    ) >= 5 THEN
      RAISE EXCEPTION 'ANONYMOUS_LETTER_LIMIT';
    END IF;
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

-- 2. Close direct access to share links -------------------------------------

ALTER TABLE public.shared_analysis_links
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz;

ALTER TABLE public.shared_analysis_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view non-revoked active shared links" ON public.shared_analysis_links;
DROP POLICY IF EXISTS "Users can view own shared links" ON public.shared_analysis_links;
DROP POLICY IF EXISTS "Users can create shared links" ON public.shared_analysis_links;
DROP POLICY IF EXISTS "Users can update own shared links" ON public.shared_analysis_links;
DROP POLICY IF EXISTS "Users can delete own shared links" ON public.shared_analysis_links;
DROP POLICY IF EXISTS "tenant_shared_links_insert" ON public.shared_analysis_links;
DROP POLICY IF EXISTS "tenant_shared_links_update" ON public.shared_analysis_links;
DROP POLICY IF EXISTS "tenant_shared_links_delete" ON public.shared_analysis_links;

REVOKE ALL ON public.shared_analysis_links FROM PUBLIC, anon, authenticated;

-- The earlier token RPC and owner view compare or expose raw tokens. Replace them.
DROP FUNCTION IF EXISTS public.get_shared_analysis(text, text);
DROP VIEW IF EXISTS public.shared_analysis_links_safe;

-- Any link created under the raw-token scheme can never match a digest. End it.
UPDATE public.shared_analysis_links
SET revoked_at = now()
WHERE revoked_at IS NULL
  AND share_token !~ '^[0-9a-f]{64}$';

CREATE INDEX IF NOT EXISTS idx_shared_links_token
  ON public.shared_analysis_links(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_links_letter_id
  ON public.shared_analysis_links(letter_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_created_by
  ON public.shared_analysis_links(created_by);

-- 3. Owner functions ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_letter_share(
  p_letter_id uuid,
  p_expires_in_days integer DEFAULT 7
)
RETURNS TABLE (id uuid, token text, expires_at timestamptz)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
  raw_token text;
  new_id uuid;
  new_expiry timestamptz;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_expires_in_days IS NULL OR p_expires_in_days NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'expiry must be between 1 and 30 days' USING ERRCODE = '22023';
  END IF;

  -- Lock the letter row so the active-link cap cannot be raced.
  PERFORM 1
  FROM public.demand_letters AS letters
  WHERE letters.id = p_letter_id
    AND letters.user_id = caller
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'letter not found' USING ERRCODE = 'P0002';
  END IF;

  IF (
    SELECT count(*)
    FROM public.shared_analysis_links AS links
    WHERE links.letter_id = p_letter_id
      AND links.revoked_at IS NULL
      AND (links.expires_at IS NULL OR links.expires_at > now())
  ) >= 10 THEN
    RAISE EXCEPTION 'SHARE_LINK_LIMIT' USING ERRCODE = 'P0001';
  END IF;

  raw_token := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  new_expiry := now() + make_interval(days => p_expires_in_days);

  INSERT INTO public.shared_analysis_links (share_token, letter_id, created_by, expires_at)
  VALUES (encode(extensions.digest(raw_token, 'sha256'), 'hex'), p_letter_id, caller, new_expiry)
  RETURNING shared_analysis_links.id INTO new_id;

  RETURN QUERY SELECT new_id, raw_token, new_expiry;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_letter_shares(p_letter_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  access_count integer,
  last_accessed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT links.id, links.created_at, links.expires_at, coalesce(links.access_count, 0), links.last_accessed_at
  FROM public.shared_analysis_links AS links
  JOIN public.demand_letters AS letters ON letters.id = links.letter_id
  WHERE links.letter_id = p_letter_id
    AND letters.user_id = auth.uid()
    AND links.created_by = auth.uid()
    AND links.revoked_at IS NULL
    AND (links.expires_at IS NULL OR links.expires_at > now())
  ORDER BY links.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.revoke_letter_share(p_link_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.shared_analysis_links AS links
  SET revoked_at = now()
  FROM public.demand_letters AS letters
  WHERE links.id = p_link_id
    AND letters.id = links.letter_id
    AND letters.user_id = auth.uid()
    AND links.created_by = auth.uid()
    AND links.revoked_at IS NULL;

  RETURN FOUND;
END;
$$;

-- 4. Recipient function -----------------------------------------------------

-- Returns NULL for unknown, expired, and revoked links alike. Never returns the
-- original file, extracted text, storage path, owner, or row ids.
CREATE OR REPLACE FUNCTION public.get_shared_letter_analysis(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  link_id uuid;
  link_letter uuid;
  link_expiry timestamptz;
  payload jsonb;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[A-Za-z0-9_-]{43}$' THEN
    RETURN NULL;
  END IF;

  SELECT links.id, links.letter_id, links.expires_at
  INTO link_id, link_letter, link_expiry
  FROM public.shared_analysis_links AS links
  WHERE links.share_token = encode(extensions.digest(p_token, 'sha256'), 'hex')
    AND links.revoked_at IS NULL
    AND (links.expires_at IS NULL OR links.expires_at > now())
    AND (links.max_access_count IS NULL OR coalesce(links.access_count, 0) < links.max_access_count);

  IF link_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'file_name', letters.file_name,
    'upload_date', letters.upload_date,
    'plaintiff_name', letters.plaintiff_name,
    'attorney_name', letters.attorney_name,
    'attorney_firm', letters.attorney_firm,
    'response_deadline', letters.response_deadline,
    'settlement_amount', letters.settlement_amount,
    'violations_cited', letters.violations_cited,
    'analysis_summary', letters.analysis_summary,
    'risk_level', letters.risk_level,
    'ai_model_version', letters.ai_model_version,
    'confidence_scores', letters.confidence_scores,
    'extracted_entities', letters.extracted_entities,
    'analysis_result', letters.analysis_result,
    'expires_at', link_expiry
  )
  INTO payload
  FROM public.demand_letters AS letters
  WHERE letters.id = link_letter;

  IF payload IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.shared_analysis_links
  SET access_count = coalesce(access_count, 0) + 1,
      last_accessed_at = now()
  WHERE id = link_id;

  RETURN payload;
END;
$$;

REVOKE ALL ON FUNCTION public.create_letter_share(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_letter_shares(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_letter_share(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_shared_letter_analysis(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_letter_share(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_letter_shares(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_letter_share(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_letter_analysis(text) TO anon, authenticated;
