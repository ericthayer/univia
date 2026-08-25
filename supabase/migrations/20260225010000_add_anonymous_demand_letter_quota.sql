/*
  Atomically persist demand letters and enforce the anonymous-user quota.

  The Edge Function calls this through its verified service-role client. The
  function accepts a server-built JSON payload and never trusts a client-side
  ownership identifier.
*/

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
    processing_status
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
    p_letter->>'processing_status'
  )
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_demand_letter(uuid, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_demand_letter(uuid, boolean, jsonb) TO service_role;
