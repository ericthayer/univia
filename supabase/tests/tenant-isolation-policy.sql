-- Requires the pgTAP extension in the disposable test database.
-- This contract test is intentionally read-only and does not create fixtures.
BEGIN;

SELECT plan(15);

SELECT ok(
  (
    SELECT count(*) = 11
    FROM pg_class AS relations
    JOIN pg_namespace AS namespaces ON namespaces.oid = relations.relnamespace
    WHERE namespaces.nspname = 'public'
      AND relations.relname = ANY (ARRAY[
        'businesses', 'accessibility_audits', 'violations', 'demand_letters',
        'action_items', 'action_plans', 'checklist_progress', 'pinned_audits',
        'shared_analysis_links', 'user_profiles', 'professional_resources'
      ])
      AND relations.relrowsecurity
  ),
  'all Univia tenant tables have RLS enabled'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'businesses', 'accessibility_audits', 'violations', 'demand_letters',
        'action_items', 'action_plans', 'checklist_progress', 'pinned_audits',
        'shared_analysis_links', 'user_profiles'
      ])
      AND roles @> ARRAY['anon']::name[]
  ),
  'anonymous users have no direct policy on tenant data'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'businesses', 'accessibility_audits', 'violations', 'demand_letters',
        'action_items', 'action_plans', 'checklist_progress', 'pinned_audits',
        'shared_analysis_links', 'user_profiles'
      ])
      AND (coalesce(qual, '') = 'true' OR coalesce(with_check, '') = 'true')
  ),
  'tenant policies do not use unconditional true predicates'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'businesses' AND policyname = 'tenant_businesses_insert' AND with_check LIKE '%owner_id%auth.uid%'),
  'business inserts require the authenticated owner'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'accessibility_audits' AND policyname = 'tenant_audits_insert' AND with_check LIKE '%user_id%auth.uid%'),
  'audit inserts require the authenticated user'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'demand_letters' AND policyname = 'tenant_letters_insert' AND with_check LIKE '%user_id%auth.uid%'),
  'letter inserts require the authenticated user'
);

SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_analysis_links' AND cmd = 'SELECT' AND 'authenticated' = ANY (roles)),
  'share-link table has no direct authenticated SELECT policy'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_class AS relations JOIN pg_namespace AS namespaces ON namespaces.oid = relations.relnamespace WHERE namespaces.nspname = 'public' AND relations.relname = 'shared_analysis_links_safe' AND relations.relkind = 'v'),
  'share-link owners use a password-safe view'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_proc AS functions JOIN pg_namespace AS namespaces ON namespaces.oid = functions.pronamespace WHERE namespaces.nspname = 'public' AND functions.proname = 'get_shared_analysis'),
  'public sharing uses the allowlisted RPC'
);

SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_proc AS functions JOIN pg_namespace AS namespaces ON namespaces.oid = functions.pronamespace WHERE namespaces.nspname = 'public' AND functions.proname = 'is_admin'),
  'the migration does not replace an unrelated global is_admin helper'
);

SELECT ok(
  NOT has_function_privilege('public', 'public.prevent_profile_privilege_escalation()', 'EXECUTE'),
  'profile protection trigger function is not publicly executable'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shared_analysis_links_safe'
      AND column_name = 'password_hash'
  ),
  'safe share-link view does not expose password hashes'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pinned_audits' AND policyname = 'tenant_pinned_update' AND cmd = 'UPDATE'),
  'pinned audits have an owner-scoped update policy'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_proc AS functions
    JOIN pg_namespace AS namespaces ON namespaces.oid = functions.pronamespace
    WHERE namespaces.nspname = 'public'
      AND functions.proname = 'get_shared_analysis'
      AND pg_get_function_identity_arguments(functions.oid) = 'p_share_token text, p_password text'
      AND pg_get_functiondef(functions.oid) LIKE '%access_count%+ 1%'
  ),
  'share RPC verifies optional passwords and increments access counts'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname IN (
        'Authenticated users can upload demand letters',
        'Users can view own demand letter files',
        'Users can update own demand letter files',
        'Users can delete own demand letter files',
        'Service role can manage all demand letter files'
      )
  ),
  'legacy demand-letter storage policies are removed'
);

SELECT * FROM finish();
ROLLBACK;
