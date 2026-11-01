-- Behavioral test for 20261101120000_letter_share_links.sql.
-- Run as postgres against a disposable database after migrations. Plain SQL
-- (no pgTAP): any failed ASSERT aborts with an error. Everything rolls back.
-- Do not run against production.
BEGIN;

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.demand_letters (id, user_id, file_name, analysis_summary, risk_level, extracted_text, file_storage_path, analysis_result)
VALUES
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000000a1', 'a-letter.pdf', 'A summary', 'high', 'SECRET RAW TEXT', 'documents/a.pdf', '{"keyPoints":["k1"]}'),
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-0000000000b2', 'b-letter.pdf', 'B summary', 'low', NULL, NULL, NULL);

CREATE TEMP TABLE t_share (id uuid, token text, expires_at timestamptz);
GRANT ALL ON t_share TO anon, authenticated;

-- Owner A creates a link.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
INSERT INTO t_share SELECT * FROM public.create_letter_share('00000000-0000-0000-0000-00000000a001', 7);

DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM t_share;
  ASSERT r.token ~ '^[A-Za-z0-9_-]{43}$', 'token is 43-char base64url';
  ASSERT r.expires_at > now() + interval '6 days', 'expiry honours days';
  ASSERT (SELECT count(*) FROM public.list_letter_shares('00000000-0000-0000-0000-00000000a001')) = 1, 'owner lists link';
END $$;

-- Direct table access is closed for authenticated users.
DO $$
BEGIN
  BEGIN
    PERFORM 1 FROM public.shared_analysis_links;
    ASSERT false, 'authenticated must not select shared_analysis_links';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

-- A cannot share B's letter; out-of-range expiry rejected.
DO $$
BEGIN
  BEGIN
    PERFORM public.create_letter_share('00000000-0000-0000-0000-00000000b001', 7);
    ASSERT false, 'A must not share B letter';
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  BEGIN
    PERFORM public.create_letter_share('00000000-0000-0000-0000-00000000a001', 365);
    ASSERT false, 'expiry over 30 days must fail';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
END $$;

-- B cannot list or revoke A's link.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.list_letter_shares('00000000-0000-0000-0000-00000000a001')) = 0, 'B lists nothing';
  ASSERT NOT public.revoke_letter_share((SELECT id FROM t_share)), 'B cannot revoke';
END $$;

-- Anonymous recipient reads the analysis with the token.
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
DO $$
DECLARE payload jsonb;
BEGIN
  BEGIN
    PERFORM 1 FROM public.shared_analysis_links;
    ASSERT false, 'anon must not select shared_analysis_links';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  payload := public.get_shared_letter_analysis((SELECT token FROM t_share));
  ASSERT payload->>'file_name' = 'a-letter.pdf', 'recipient sees letter';
  ASSERT payload->'analysis_result'->'keyPoints'->>0 = 'k1', 'recipient sees full analysis';
  ASSERT NOT (payload ? 'extracted_text'), 'raw text never shared';
  ASSERT NOT (payload ? 'file_storage_path'), 'file path never shared';
  ASSERT NOT (payload ? 'user_id') AND NOT (payload ? 'id'), 'ids never shared';
  ASSERT public.get_shared_letter_analysis('x') IS NULL, 'malformed token returns null';
  ASSERT public.get_shared_letter_analysis(repeat('A', 43)) IS NULL, 'unknown token returns null';
END $$;

-- Only the digest is stored; the view was counted.
RESET ROLE;
DO $$
DECLARE stored text; views integer;
BEGIN
  SELECT share_token, access_count INTO stored, views FROM public.shared_analysis_links;
  ASSERT stored ~ '^[0-9a-f]{64}$' AND stored <> (SELECT token FROM t_share), 'only digest stored';
  ASSERT views = 1, 'access counted';
END $$;

-- Owner revokes; the link stops working.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
DO $$
BEGIN
  ASSERT public.revoke_letter_share((SELECT id FROM t_share)), 'owner revokes';
  ASSERT public.get_shared_letter_analysis((SELECT token FROM t_share)) IS NULL, 'revoked link returns null';
  ASSERT (SELECT count(*) FROM public.list_letter_shares('00000000-0000-0000-0000-00000000a001')) = 0, 'revoked link not listed';
END $$;

-- Active link cap.
DO $$
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM public.create_letter_share('00000000-0000-0000-0000-00000000a001', 1);
  END LOOP;
  BEGIN
    PERFORM public.create_letter_share('00000000-0000-0000-0000-00000000a001', 1);
    ASSERT false, '11th active link must fail';
  EXCEPTION WHEN raise_exception THEN
    ASSERT SQLERRM = 'SHARE_LINK_LIMIT', 'limit error code';
  END;
END $$;

-- Anonymous role cannot create links.
RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.create_letter_share('00000000-0000-0000-0000-00000000a001', 1);
    ASSERT false, 'anon must not create links';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

RESET ROLE;
SELECT 'letter-sharing-behavior: all assertions passed' AS result;
ROLLBACK;
