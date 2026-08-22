-- Behavioral RLS test for a disposable Supabase database.
-- Run after the hardening migration as a superuser/postgres role. The fixed
-- UUIDs make this fixture self-contained; the transaction rolls everything
-- back. Do not run against production.
BEGIN;

SELECT plan(18);

INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'tenant-a@example.invalid', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', 'tenant-b@example.invalid', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000ad', 'authenticated', 'authenticated', 'admin@example.invalid', '', now(), '{}', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, email, full_name, is_admin, status)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'tenant-a@example.invalid', 'Tenant A', false, 'active'),
  ('00000000-0000-0000-0000-0000000000b2', 'tenant-b@example.invalid', 'Tenant B', false, 'active'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.invalid', 'Admin', true, 'active')
ON CONFLICT (id) DO UPDATE
SET is_admin = EXCLUDED.is_admin, status = EXCLUDED.status;

SET ROLE service_role;

INSERT INTO public.businesses (id, name, website_url, contact_email, owner_id)
VALUES
  ('00000000-0000-0000-0000-0000000000ba', 'Business A', 'https://a.example.invalid', 'a@example.invalid', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000bb', 'Business B', 'https://b.example.invalid', 'b@example.invalid', '00000000-0000-0000-0000-0000000000b2');

INSERT INTO public.accessibility_audits (id, business_id, url_scanned, user_id)
VALUES
  ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-0000000000ba', 'https://a.example.invalid', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000ab', '00000000-0000-0000-0000-0000000000bb', 'https://b.example.invalid', '00000000-0000-0000-0000-0000000000b2');

INSERT INTO public.violations (id, audit_id, wcag_guideline, severity, title)
VALUES
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000aa', '1.1.1', 'minor', 'A violation'),
  ('00000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-0000000000ab', '1.1.1', 'minor', 'B violation');

INSERT INTO public.demand_letters (id, business_id, file_name, user_id, analysis_summary)
VALUES
  ('00000000-0000-0000-0000-00000000001a', '00000000-0000-0000-0000-0000000000ba', 'a.pdf', '00000000-0000-0000-0000-0000000000a1', 'A analysis');

INSERT INTO public.shared_analysis_links (share_token, letter_id, created_by, password_hash, max_access_count)
VALUES (
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '00000000-0000-0000-0000-00000000001a',
  '00000000-0000-0000-0000-0000000000a1',
  extensions.crypt('correct horse', extensions.gen_salt('bf')),
  1
);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

SELECT is((SELECT count(*) FROM public.businesses), 1::bigint, 'owner A sees only business A');
SELECT is((SELECT count(*) FROM public.businesses WHERE id = '00000000-0000-0000-0000-0000000000bb'), 0::bigint, 'owner A cannot see business B');
INSERT INTO public.businesses (id, name, website_url, contact_email, owner_id)
VALUES ('00000000-0000-0000-0000-0000000000bc', 'Forged owner input', 'https://forged-owner.example.invalid', 'forged@example.invalid', '00000000-0000-0000-0000-0000000000b2');
SELECT is((SELECT owner_id FROM public.businesses WHERE id = '00000000-0000-0000-0000-0000000000bc'), '00000000-0000-0000-0000-0000000000a1'::uuid, 'business owner is derived from the authenticated user');
SELECT is((SELECT count(*) FROM public.accessibility_audits), 1::bigint, 'owner A sees only audit A');
SELECT is((SELECT count(*) FROM public.accessibility_audits WHERE id = '00000000-0000-0000-0000-0000000000ab'), 0::bigint, 'owner A cannot see audit B');

SELECT throws_ok(
  $$INSERT INTO public.accessibility_audits (id, business_id, url_scanned, user_id)
    VALUES ('00000000-0000-0000-0000-0000000000ac', '00000000-0000-0000-0000-0000000000bb', 'https://forged.example.invalid', '00000000-0000-0000-0000-0000000000b2')$$,
  '42501', NULL,
  'forged audit ownership is rejected'
);
SELECT is((SELECT count(*) FROM public.accessibility_audits WHERE id = '00000000-0000-0000-0000-0000000000ac'), 0::bigint, 'rejected audit insert has no side effect');
SELECT is((SELECT count(*) FROM public.violations), 1::bigint, 'owner A sees violations only through audit A');
SELECT is((SELECT count(*) FROM public.violations WHERE id = '00000000-0000-0000-0000-0000000000cb'), 0::bigint, 'owner A cannot see violation B');

SELECT is((SELECT count(*) FROM public.shared_analysis_links_safe), 1::bigint, 'owner A sees a safe share-link projection');

SET ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claim.role', 'anon', true);
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT is((SELECT count(*) FROM public.shared_analysis_links), 0::bigint, 'anonymous direct share-link reads are blocked');
SELECT is((SELECT count(*) FROM public.get_shared_analysis('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'wrong password')), 0::bigint, 'wrong share password returns no analysis');

SET ROLE service_role;
SELECT is((SELECT access_count FROM public.shared_analysis_links WHERE share_token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), 0, 'failed share access does not increment the counter');

SET ROLE anon;
SELECT is((SELECT count(*) FROM public.get_shared_analysis('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'correct horse')), 1::bigint, 'correct share password returns the analysis');
SET ROLE service_role;
SELECT is((SELECT access_count FROM public.shared_analysis_links WHERE share_token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), 1, 'successful share access increments the counter');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
SELECT throws_ok(
  $$UPDATE public.user_profiles SET is_admin = true WHERE id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', NULL,
  'non-admin cannot escalate profile privileges'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ad', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}', true);
SELECT is((SELECT count(*) FROM public.businesses), 3::bigint, 'active admin sees all businesses');
SELECT is((SELECT count(*) FROM public.accessibility_audits), 2::bigint, 'active admin sees all audits');

SELECT * FROM finish();
ROLLBACK;
RESET ROLE;
