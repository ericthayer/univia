/*
  Give real accounts a user_profiles row, and make profiles editable again.
  See docs/specs/monitor-launch/SPEC.md, Phase 1.

  Sign-up: production's handle_new_user() writes to the retired public.profiles
  table, so accounts created since 2026-02 have no user_profiles row. Guests are
  skipped on purpose: they have no email and user_profiles.email is required.
  Guests who become real accounts are picked up by the update trigger.

  Saving: the update policy read user_profiles from inside its own check, which
  Postgres rejects as infinite recursion, so every save failed. Plan and
  privilege fields stay protected by the trigger below.

  Admins: the app's admin pages list all accounts, but the only read policy was
  owner-only. univia_is_admin() adds that access without policy recursion.
*/

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

REVOKE ALL ON FUNCTION public.univia_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.univia_is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_anonymous IS TRUE OR NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        split_part(NEW.email, '@', 1)
      )
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  EXCEPTION WHEN unique_violation THEN
    -- A stale email on another profile must never block signing in.
    RAISE WARNING 'user_profiles email conflict for user %', NEW.id;
  END;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- on_auth_user_created already calls this function, so it needs no change.
-- This one covers guests who convert, and email changes on existing accounts.
CREATE TRIGGER on_auth_user_changed
  AFTER UPDATE OF email, is_anonymous ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email OR NEW.is_anonymous IS DISTINCT FROM OLD.is_anonymous)
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.user_profiles (id, email, full_name)
SELECT
  users.id,
  users.email,
  COALESCE(
    NULLIF(users.raw_user_meta_data->>'full_name', ''),
    NULLIF(users.raw_user_meta_data->>'name', ''),
    split_part(users.email, '@', 1)
  )
FROM auth.users AS users
WHERE users.email IS NOT NULL
  AND users.is_anonymous IS NOT TRUE
ON CONFLICT DO NOTHING;

-- Same gate as 20261102020000, now also covering fields only the system sets.
-- Auth sync passes because it runs with no JWT claims.
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
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.audit_count IS DISTINCT FROM OLD.audit_count OR
    NEW.last_login IS DISTINCT FROM OLD.last_login OR
    NEW.created_at IS DISTINCT FROM OLD.created_at
  )
  AND coalesce(auth.role(), '') IN ('authenticated', 'anon')
  AND NOT public.univia_is_admin() THEN
    RAISE EXCEPTION 'protected profile fields cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "tenant_profiles_select"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id OR public.univia_is_admin());

CREATE POLICY "tenant_profiles_update"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id OR public.univia_is_admin())
  WITH CHECK ((select auth.uid()) = id OR public.univia_is_admin());
