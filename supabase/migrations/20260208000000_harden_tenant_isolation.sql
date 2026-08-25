/*
  Harden tenant isolation and database-backed authorization.

  This migration is intentionally forward-only. It replaces permissive policies
  from earlier migrations without rewriting migration history.
*/

-- This migration intentionally stops before changing policies when legacy
-- records have no attributable owner. Production currently has 36 audits and
-- 40 demand letters in this state, with no businesses to use for recovery.
-- Export and review those records, then assign each approved owner (or retain
-- them in an operator-only archive) before applying this migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.accessibility_audits WHERE user_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.demand_letters WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'tenant isolation migration blocked: legacy audits or demand letters have NULL user_id; perform approved ownership recovery first';
  END IF;
END;
$$;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id
  ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_audits_user_id
  ON public.accessibility_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_demand_letters_user_id
  ON public.demand_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_business_id
  ON public.action_items(business_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_user_id
  ON public.action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_user_id
  ON public.checklist_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_audits_user_id
  ON public.pinned_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_created_by
  ON public.shared_analysis_links(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_links_token
  ON public.shared_analysis_links(share_token);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_analysis_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_resources ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.univia_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = (select auth.uid())
      AND is_admin = true
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_business(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses
    WHERE id = target_business_id
      AND owner_id = (select auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_audit(target_audit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.accessibility_audits
    WHERE id = target_audit_id
      AND user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_letter(target_letter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.demand_letters
    WHERE id = target_letter_id
      AND user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.set_business_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.univia_is_admin() THEN
    NEW.owner_id := (select auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_business_owner_before_write ON public.businesses;
CREATE TRIGGER set_business_owner_before_write
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_business_owner();

REVOKE ALL ON FUNCTION public.univia_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_owns_business(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_owns_audit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_owns_letter(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_business_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.univia_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_business(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_audit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_letter(uuid) TO authenticated;

-- Remove every prior public-table policy in the tenant boundary. The policies
-- below are operation-specific and use owner IDs, never caller-supplied claims.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'businesses',
        'accessibility_audits',
        'violations',
        'demand_letters',
        'action_items',
        'action_plans',
        'checklist_progress',
        'pinned_audits',
        'shared_analysis_links',
        'user_profiles',
        'professional_resources'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END
$$;

-- Profiles: users may edit their own profile; privileged fields are protected
-- by a trigger below. Active admins may manage profiles through the database.
CREATE POLICY "tenant_profiles_select"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id OR public.univia_is_admin());

CREATE POLICY "tenant_profiles_update"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id OR public.univia_is_admin())
  WITH CHECK ((select auth.uid()) = id OR public.univia_is_admin());

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.univia_is_admin() AND (
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.tier IS DISTINCT FROM OLD.tier OR
    NEW.audit_limit IS DISTINCT FROM OLD.audit_limit OR
    NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.audit_count IS DISTINCT FROM OLD.audit_count OR
    NEW.last_login IS DISTINCT FROM OLD.last_login OR
    NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'protected profile fields cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.user_profiles;
CREATE TRIGGER protect_profile_privileged_fields
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Businesses are owned by one user in this release. Existing rows without an
-- owner remain inaccessible until explicitly assigned by an administrator.
CREATE POLICY "tenant_businesses_select"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_businesses_insert"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_businesses_update"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()) OR public.univia_is_admin())
  WITH CHECK (owner_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_businesses_delete"
  ON public.businesses FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()) OR public.univia_is_admin());

-- Audits and their violations are private to the authenticated owner.
CREATE POLICY "tenant_audits_select"
  ON public.accessibility_audits FOR SELECT
  TO authenticated
  USING (
    (
      user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_audits_insert"
  ON public.accessibility_audits FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_audits_update"
  ON public.accessibility_audits FOR UPDATE
  TO authenticated
  USING (
    (
      user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
    )
    OR public.univia_is_admin()
  )
  WITH CHECK (
    (user_id = (select auth.uid()) OR public.univia_is_admin())
    AND (
      business_id IS NULL
      OR public.user_owns_business(business_id)
      OR public.univia_is_admin()
    )
  );

CREATE POLICY "tenant_audits_delete"
  ON public.accessibility_audits FOR DELETE
  TO authenticated
  USING (
    (
      user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_violations_select"
  ON public.violations FOR SELECT
  TO authenticated
  USING (public.user_owns_audit(audit_id) OR public.univia_is_admin());

CREATE POLICY "tenant_violations_insert"
  ON public.violations FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_audit(audit_id) OR public.univia_is_admin());

CREATE POLICY "tenant_violations_update"
  ON public.violations FOR UPDATE
  TO authenticated
  USING (public.user_owns_audit(audit_id) OR public.univia_is_admin())
  WITH CHECK (public.user_owns_audit(audit_id) OR public.univia_is_admin());

CREATE POLICY "tenant_violations_delete"
  ON public.violations FOR DELETE
  TO authenticated
  USING (public.user_owns_audit(audit_id) OR public.univia_is_admin());

-- Demand letters are always tied to the verified user, even when no business
-- is selected. A supplied business ID must belong to that user.
CREATE POLICY "tenant_letters_select"
  ON public.demand_letters FOR SELECT
  TO authenticated
  USING (
    (
      user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_letters_insert"
  ON public.demand_letters FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_letters_update"
  ON public.demand_letters FOR UPDATE
  TO authenticated
  USING (
    (
      user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
    )
    OR public.univia_is_admin()
  )
  WITH CHECK (
    (user_id = (select auth.uid()) OR public.univia_is_admin())
    AND (
      business_id IS NULL
      OR public.user_owns_business(business_id)
      OR public.univia_is_admin()
    )
  );

CREATE POLICY "tenant_letters_delete"
  ON public.demand_letters FOR DELETE
  TO authenticated
  USING (
    (
      user_id = (select auth.uid())
      AND (
        business_id IS NULL
        OR public.user_owns_business(business_id)
      )
    )
    OR public.univia_is_admin()
  );

-- Legacy action_items are scoped through their owning business.
CREATE POLICY "tenant_action_items_select"
  ON public.action_items FOR SELECT
  TO authenticated
  USING (public.user_owns_business(business_id) OR public.univia_is_admin());

CREATE POLICY "tenant_action_items_insert"
  ON public.action_items FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      public.user_owns_business(business_id)
      AND (
        related_audit_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.accessibility_audits AS audits
          WHERE audits.id = related_audit_id
            AND audits.business_id = action_items.business_id
            AND audits.user_id = (select auth.uid())
        )
      )
      AND (
        related_letter_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.demand_letters AS letters
          WHERE letters.id = related_letter_id
            AND letters.business_id = action_items.business_id
            AND letters.user_id = (select auth.uid())
        )
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_action_items_update"
  ON public.action_items FOR UPDATE
  TO authenticated
  USING (public.user_owns_business(business_id) OR public.univia_is_admin())
  WITH CHECK (
    (
      public.user_owns_business(business_id)
      AND (
        related_audit_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.accessibility_audits AS audits
          WHERE audits.id = related_audit_id
            AND audits.business_id = action_items.business_id
            AND audits.user_id = (select auth.uid())
        )
      )
      AND (
        related_letter_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.demand_letters AS letters
          WHERE letters.id = related_letter_id
            AND letters.business_id = action_items.business_id
            AND letters.user_id = (select auth.uid())
        )
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_action_items_delete"
  ON public.action_items FOR DELETE
  TO authenticated
  USING (public.user_owns_business(business_id) OR public.univia_is_admin());

-- User-scoped action plans and checklist progress.
CREATE POLICY "tenant_action_plans_select"
  ON public.action_plans FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_action_plans_insert"
  ON public.action_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      user_id = (select auth.uid())
      AND (
        related_audit_id IS NULL
        OR public.user_owns_audit(related_audit_id)
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_action_plans_update"
  ON public.action_plans FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.univia_is_admin())
  WITH CHECK (
    (
      user_id = (select auth.uid())
      AND (
        related_audit_id IS NULL
        OR public.user_owns_audit(related_audit_id)
      )
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_action_plans_delete"
  ON public.action_plans FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_checklist_select"
  ON public.checklist_progress FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_checklist_insert"
  ON public.checklist_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_checklist_update"
  ON public.checklist_progress FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.univia_is_admin())
  WITH CHECK (user_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_checklist_delete"
  ON public.checklist_progress FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.univia_is_admin());

CREATE POLICY "tenant_pinned_select"
  ON public.pinned_audits FOR SELECT
  TO authenticated
  USING (
    (user_id = (select auth.uid()) AND public.user_owns_audit(audit_id))
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_pinned_insert"
  ON public.pinned_audits FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = (select auth.uid()) AND public.user_owns_audit(audit_id))
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_pinned_update"
  ON public.pinned_audits FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.univia_is_admin())
  WITH CHECK (
    (
      user_id = (select auth.uid())
      AND public.user_owns_audit(audit_id)
    )
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_pinned_delete"
  ON public.pinned_audits FOR DELETE
  TO authenticated
  USING (
    (user_id = (select auth.uid()) AND public.user_owns_audit(audit_id))
    OR public.univia_is_admin()
  );

-- Only the link owner can manage links. Direct table SELECT is deliberately
-- disabled because the table contains password_hash. Owners use the safe view
-- below, while public consumers use the token RPC.
CREATE POLICY "tenant_shared_links_insert"
  ON public.shared_analysis_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (created_by = (select auth.uid()) AND public.user_owns_letter(letter_id))
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_shared_links_update"
  ON public.shared_analysis_links FOR UPDATE
  TO authenticated
  USING (
    (
      created_by = (select auth.uid())
      AND public.user_owns_letter(letter_id)
    )
    OR public.univia_is_admin()
  )
  WITH CHECK (
    (created_by = (select auth.uid()) AND public.user_owns_letter(letter_id))
    OR public.univia_is_admin()
  );

CREATE POLICY "tenant_shared_links_delete"
  ON public.shared_analysis_links FOR DELETE
  TO authenticated
  USING (
    (
      created_by = (select auth.uid())
      AND public.user_owns_letter(letter_id)
    )
    OR public.univia_is_admin()
  );

CREATE OR REPLACE VIEW public.shared_analysis_links_safe AS
SELECT
  id,
  share_token,
  letter_id,
  created_by,
  expires_at,
  access_count,
  max_access_count,
  revoked_at,
  created_at
FROM public.shared_analysis_links
WHERE (
  created_by = (select auth.uid())
  AND public.user_owns_letter(letter_id)
)
OR public.univia_is_admin();

REVOKE ALL ON public.shared_analysis_links_safe FROM PUBLIC;
GRANT SELECT ON public.shared_analysis_links_safe TO authenticated;

CREATE OR REPLACE FUNCTION public.get_shared_analysis(
  p_share_token text,
  p_password text DEFAULT NULL
)
RETURNS TABLE (
  letter_id uuid,
  analysis_summary text,
  risk_level text,
  response_deadline date,
  violations_cited jsonb,
  expires_at timestamptz
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  matching_link public.shared_analysis_links%ROWTYPE;
BEGIN
    IF length(p_share_token) NOT BETWEEN 32 AND 256
      OR (p_password IS NOT NULL AND length(p_password) > 256) THEN
    RETURN;
  END IF;

  SELECT * INTO matching_link
  FROM public.shared_analysis_links AS links
  WHERE links.share_token = p_share_token
    AND links.revoked_at IS NULL
    AND (links.expires_at IS NULL OR links.expires_at > now())
    AND (
      links.max_access_count IS NULL
      OR coalesce(links.access_count, 0) < links.max_access_count
    )
    AND (
      links.password_hash IS NULL
      OR (
        p_password IS NOT NULL
        AND extensions.crypt(p_password, links.password_hash) = links.password_hash
      )
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.shared_analysis_links
  SET access_count = coalesce(access_count, 0) + 1
  WHERE id = matching_link.id;

  RETURN QUERY
  SELECT
    matching_link.letter_id,
    letters.analysis_summary,
    letters.risk_level,
    letters.response_deadline,
    letters.violations_cited,
    matching_link.expires_at
  FROM public.demand_letters AS letters
  WHERE letters.id = matching_link.letter_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_analysis(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_analysis(text, text) TO anon, authenticated;

-- Professional resources are intentionally public to support the resource
-- directory; only active admins can mutate them.
CREATE POLICY "public_resources_select"
  ON public.professional_resources FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admin_resources_insert"
  ON public.professional_resources FOR INSERT
  TO authenticated
  WITH CHECK (public.univia_is_admin());

CREATE POLICY "admin_resources_update"
  ON public.professional_resources FOR UPDATE
  TO authenticated
  USING (public.univia_is_admin())
  WITH CHECK (public.univia_is_admin());

CREATE POLICY "admin_resources_delete"
  ON public.professional_resources FOR DELETE
  TO authenticated
  USING (public.univia_is_admin());

-- Recreate only the known demand-letter storage policies. Other applications
-- may share the storage schema and must not be affected by this migration.
DROP POLICY IF EXISTS "Authenticated users can upload demand letters" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own demand letter files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own demand letter files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own demand letter files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all demand letter files" ON storage.objects;

CREATE POLICY "tenant_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'demand-letters'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR public.univia_is_admin()
    )
  );

CREATE POLICY "tenant_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'demand-letters'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR public.univia_is_admin()
    )
  );

CREATE POLICY "tenant_storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'demand-letters'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR public.univia_is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'demand-letters'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR public.univia_is_admin()
    )
  );

CREATE POLICY "tenant_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'demand-letters'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR public.univia_is_admin()
    )
  );
