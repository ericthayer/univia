/*
  Stop users from granting themselves admin, a paid tier or a higher quota.

  Production's "Users can update own profile" policy only pins `tier`, so a
  signed-in user can set their own `is_admin`, `audit_limit` or `status`
  through the REST API. analyze-document now reserves the Pro model and
  detailed analysis for admins, which makes `is_admin` a paid entitlement.

  20260208000000_harden_tenant_isolation adds an equivalent trigger but is not
  applied in production (blocked by legacy rows), and depends on
  univia_is_admin(). This migration is self-contained: the admin check is
  inline. If the hardening migration runs later, it replaces this function
  with its own stricter version under the same name, which is intended.

  Only end-user API requests (JWT role authenticated or anon) are checked.

  Only privilege fields are protected here; audit_count, last_login and email
  are left alone so existing triggers and auth sync keep working.
*/

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF (
    NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
    NEW.tier IS DISTINCT FROM OLD.tier OR
    NEW.audit_limit IS DISTINCT FROM OLD.audit_limit OR
    NEW.status IS DISTINCT FROM OLD.status
  )
  -- Only end-user API requests are checked. The service role and direct SQL
  -- sessions (dashboard, migrations: no JWT claims) pass through.
  AND coalesce(auth.role(), '') IN ('authenticated', 'anon')
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND is_admin = true
      AND status = 'active'
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
