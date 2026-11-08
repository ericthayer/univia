/*
  Close access-control gaps ahead of the Monitor launch.
  See docs/specs/monitor-launch/SPEC.md, Phase 0.

  Forward-only. Removes no rows. Browser clients read these tables through
  the policies that remain; every write below is already made by Edge
  Functions using the service role, which is unaffected.

  Tenant ownership (businesses.owner_id, legacy ownerless rows) is Phase 1.
*/

-- Tables left by a retired prototype. Nothing in this repo uses them, except
-- handle_new_user(), which writes to profiles as SECURITY DEFINER and keeps
-- working until Phase 1 replaces it. Tables stay in place, closed to clients.
DO $$
DECLARE
  retired_table text;
  retired_policy record;
BEGIN
  FOREACH retired_table IN ARRAY ARRAY[
    'user_roles', 'profiles', 'scans', 'uploads', 'scan_results', 'assets', 'case_studies'
  ] LOOP
    IF to_regclass(format('public.%I', retired_table)) IS NULL THEN
      CONTINUE;
    END IF;

    FOR retired_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = retired_table
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', retired_policy.policyname, retired_table);
    END LOOP;

    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', retired_table);
  END LOOP;
END;
$$;

-- These read user_roles, so they must go with it. Left in place they could
-- fail with "permission denied" while checking unrelated demand-letter uploads.
DROP POLICY IF EXISTS "Publishers can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Publishers can upload" ON storage.objects;
DROP POLICY IF EXISTS "Publishers can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view assets" ON storage.objects;

-- Clients have no direct path to these tables. Owner-scoped policies return
-- with businesses.owner_id in Phase 1.
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own action items" ON public.action_items;
DROP POLICY IF EXISTS "Users can insert action items" ON public.action_items;
DROP POLICY IF EXISTS "Users can update their own action items" ON public.action_items;

-- Letters are created only by analyze-document, through insert_demand_letter().
DROP POLICY IF EXISTS "Anonymous users can view own demand letters" ON public.demand_letters;
DROP POLICY IF EXISTS "Authenticated and anonymous users can insert demand letters" ON public.demand_letters;

-- Audits and violations are written only by run-lighthouse-audit.
DROP POLICY IF EXISTS "Anonymous users can create audits" ON public.accessibility_audits;
DROP POLICY IF EXISTS "Users can create audits for their businesses" ON public.accessibility_audits;
DROP POLICY IF EXISTS "Anonymous users can create violations" ON public.violations;
DROP POLICY IF EXISTS "Users can create violations" ON public.violations;

-- Trigger functions and internal RPCs are not part of the public API. Revoking
-- EXECUTE does not stop triggers: Postgres checks it when a trigger is created,
-- not when it fires. get_shared_letter_analysis stays public by design: it is
-- the share-link entry point and validates its token.
DO $$
DECLARE
  target text;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'public.get_all_users_with_roles()',
    'public.update_user_role(uuid, text)',
    'public.get_user_role(uuid)',
    'public.handle_new_user()',
    'public.prevent_profile_privilege_escalation()',
    'public.insert_demand_letter(uuid, boolean, jsonb)'
  ] LOOP
    IF to_regprocedure(target) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', target);
    END IF;
  END LOOP;

  FOREACH target IN ARRAY ARRAY[
    'public.get_all_users_with_roles()',
    'public.update_user_role(uuid, text)',
    'public.get_user_role(uuid)',
    'public.handle_new_user()'
  ] LOOP
    IF to_regprocedure(target) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', target);
    END IF;
  END LOOP;
END;
$$;
