/*
  Repair profiles that disagree with Auth, keep sign-up dates, and drop a
  letter insert policy that rebuilt databases still get. See PR #39 review.

  Forward-only. 20261107211608 and 20251231232014 stay as they ran in
  production; this file corrects what they left behind.

  Production: the policy drop is a no-op there. The repair statements change
  data, so apply only with the owner's go-ahead.
*/

-- 20251231232014 creates this policy, and no later migration removes it.
-- Left active, it lets clients insert letters for any user_id, which bypasses
-- insert_demand_letter()'s quota checks. Production never had it.
DROP POLICY IF EXISTS "Anyone can insert demand letters" ON public.demand_letters;

-- A profile can keep an address that Auth has moved on from, if an earlier
-- update failed. Auth is the source of truth, so resync those profiles first.
-- If two profiles need each other's address, this fails the whole migration.
UPDATE public.user_profiles AS profile
SET email = account.email
FROM auth.users AS account
WHERE account.id = profile.id
  AND account.email IS NOT NULL
  AND account.is_anonymous IS NOT TRUE
  AND profile.email IS DISTINCT FROM account.email;

-- Sign-up and email sync now resync a stale holder before writing, and keep
-- the account's own created_at. Conflicts on email still raise a warning
-- instead of blocking sign-in, as before.
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
    -- Another profile can still hold this address after Auth released it.
    -- Its own account is the source of truth, so resync that profile first.
    UPDATE public.user_profiles AS profile
    SET email = account.email
    FROM auth.users AS account
    WHERE profile.email = NEW.email
      AND profile.id <> NEW.id
      AND account.id = profile.id
      AND account.email IS NOT NULL
      AND account.email IS DISTINCT FROM NEW.email;

    INSERT INTO public.user_profiles (id, email, full_name, created_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(NEW.created_at, now())
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

-- Backfilled profiles all carry the timestamp of the transaction that wrote
-- them, so they are the only profiles whose created_at repeats. Restore each
-- account's own sign-up time. The metrics count new users by this column.
UPDATE public.user_profiles AS profile
SET created_at = account.created_at
FROM auth.users AS account
WHERE account.id = profile.id
  AND account.created_at IS NOT NULL
  AND profile.created_at > account.created_at + interval '1 minute'
  AND profile.created_at IN (
    SELECT created_at FROM public.user_profiles GROUP BY created_at HAVING count(*) > 1
  );

-- Retry the backfill for accounts still without a profile, now that stale
-- addresses are resynced. Only the id conflict is skipped. An email conflict
-- fails the migration so it can be resolved by hand.
INSERT INTO public.user_profiles (id, email, full_name, created_at)
SELECT
  users.id,
  users.email,
  COALESCE(
    NULLIF(users.raw_user_meta_data->>'full_name', ''),
    NULLIF(users.raw_user_meta_data->>'name', ''),
    split_part(users.email, '@', 1)
  ),
  COALESCE(users.created_at, now())
FROM auth.users AS users
WHERE users.email IS NOT NULL
  AND users.is_anonymous IS NOT TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles AS profile WHERE profile.id = users.id
  )
ON CONFLICT (id) DO NOTHING;
