/*
  Make audits private to their owner, and stop letters losing their owner.
  See docs/specs/monitor-launch/SPEC.md, Phase 1.

  Replaces 20260208000000_harden_tenant_isolation, which never ran in
  production. Since then, share links moved to token RPCs, the browser lost its
  write paths, and letter policies became owner-only, so this covers only what
  is still open.

  This stops before changing anything while ownerless audits or letters remain.
  Resolve them first (SPEC Decision 1).
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.accessibility_audits WHERE user_id IS NULL)
    OR EXISTS (SELECT 1 FROM public.demand_letters WHERE user_id IS NULL) THEN
    RAISE EXCEPTION
      'tenant isolation blocked: ownerless audits or demand letters remain; resolve SPEC Decision 1 first';
  END IF;
END;
$$;

-- run-lighthouse-audit already filters on this column. Businesses stay closed
-- to browser clients: nothing reads them directly, and RLS denies by default.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_audits_user_id ON public.accessibility_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_demand_letters_user_id ON public.demand_letters(user_id);

-- Deleting an account must take its letters and audits with it, never orphan
-- them. Files in storage are not covered by this; account deletion removes them.
ALTER TABLE public.demand_letters
  DROP CONSTRAINT IF EXISTS demand_letters_user_id_fkey,
  ADD CONSTRAINT demand_letters_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.accessibility_audits
  DROP CONSTRAINT IF EXISTS accessibility_audits_user_id_fkey,
  ADD CONSTRAINT accessibility_audits_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Audits keep a nullable owner until Phase 2 removes run-lighthouse-audit's
-- publishable-key path. Those rows match no policy below, so nobody can read them.
ALTER TABLE public.demand_letters ALTER COLUMN user_id SET NOT NULL;

-- Older migrations leave this on databases built from the repo. Production never
-- had it. Letters are created only through insert_demand_letter().
DROP POLICY IF EXISTS "Anyone can insert demand letters" ON public.demand_letters;

DROP POLICY IF EXISTS "Allow public read access to audits" ON public.accessibility_audits;
DROP POLICY IF EXISTS "Authenticated users can read own audits" ON public.accessibility_audits;
DROP POLICY IF EXISTS "Public can view violations for public audits" ON public.violations;
DROP POLICY IF EXISTS "Users can view violations for their audits" ON public.violations;

CREATE POLICY "tenant_audits_select"
  ON public.accessibility_audits FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "tenant_violations_select"
  ON public.violations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.accessibility_audits AS audits
      WHERE audits.id = violations.audit_id
        AND audits.user_id = (select auth.uid())
    )
  );
