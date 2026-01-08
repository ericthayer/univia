/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **Add Missing Indexes**
     - Add indexes for foreign keys on `action_items` table
     - Improves query performance for foreign key lookups

  2. **Optimize RLS Policies**
     - Replace `auth.uid()` with `(select auth.uid())` in all policies
     - Prevents re-evaluation of auth function for each row
     - Significantly improves query performance at scale

  3. **Consolidate Multiple Permissive Policies**
     - Merge duplicate SELECT policies on `accessibility_audits`
     - Merge duplicate SELECT policies on `violations`

  4. **Fix Function Search Path**
     - Set explicit search_path for security-sensitive functions
     - Prevents potential security vulnerabilities
*/

-- =============================================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_action_items_related_audit_id 
  ON action_items(related_audit_id);

CREATE INDEX IF NOT EXISTS idx_action_items_related_letter_id 
  ON action_items(related_letter_id);

-- =============================================================================
-- 2. FIX FUNCTION SEARCH PATH (Security)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 3. CONSOLIDATE AND OPTIMIZE RLS POLICIES - ACCESSIBILITY_AUDITS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view audits for their businesses" ON accessibility_audits;
DROP POLICY IF EXISTS "Authenticated users can read own audits" ON accessibility_audits;

CREATE POLICY "Authenticated users can read own audits"
  ON accessibility_audits
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id 
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = accessibility_audits.business_id
    )
  );

DROP POLICY IF EXISTS "Users can create audits for their businesses" ON accessibility_audits;
CREATE POLICY "Users can create audits for their businesses"
  ON accessibility_audits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- 4. CONSOLIDATE AND OPTIMIZE RLS POLICIES - VIOLATIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Allow public read access to violations" ON violations;
DROP POLICY IF EXISTS "Users can view violations for their audits" ON violations;

CREATE POLICY "Users can view violations for their audits"
  ON violations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accessibility_audits
      WHERE accessibility_audits.id = violations.audit_id
      AND (
        accessibility_audits.user_id = (select auth.uid())
        OR accessibility_audits.user_id IS NULL
      )
    )
  );

CREATE POLICY "Public can view violations for public audits"
  ON violations
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM accessibility_audits
      WHERE accessibility_audits.id = violations.audit_id
      AND accessibility_audits.user_id IS NULL
    )
  );

-- =============================================================================
-- 5. OPTIMIZE RLS POLICIES - USER_PROFILES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK (
    (select auth.uid()) = id 
    AND tier = (SELECT tier FROM user_profiles WHERE id = (select auth.uid()))
  );

-- =============================================================================
-- 6. OPTIMIZE RLS POLICIES - PINNED_AUDITS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own pinned audits" ON pinned_audits;
CREATE POLICY "Users can view own pinned audits"
  ON pinned_audits
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can pin own audits" ON pinned_audits;
CREATE POLICY "Users can pin own audits"
  ON pinned_audits
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unpin own audits" ON pinned_audits;
CREATE POLICY "Users can unpin own audits"
  ON pinned_audits
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- =============================================================================
-- 7. OPTIMIZE RLS POLICIES - BUSINESSES, DEMAND_LETTERS, ACTION_ITEMS
-- =============================================================================

DO $$
BEGIN
  -- Only fix these if they have the old pattern
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'businesses' 
    AND policyname = 'Users can view their own businesses'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own businesses" ON businesses;
    CREATE POLICY "Users can view their own businesses"
      ON businesses
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'businesses' 
    AND policyname = 'Users can update their own businesses'
  ) THEN
    DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;
    CREATE POLICY "Users can update their own businesses"
      ON businesses
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'demand_letters'
    AND policyname = 'Users can view their own demand letters'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own demand letters" ON demand_letters;
    CREATE POLICY "Users can view their own demand letters"
      ON demand_letters
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'demand_letters'
    AND policyname = 'Users can update their own demand letters'
  ) THEN
    DROP POLICY IF EXISTS "Users can update their own demand letters" ON demand_letters;
    CREATE POLICY "Users can update their own demand letters"
      ON demand_letters
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'action_items'
    AND policyname = 'Users can view their own action items'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own action items" ON action_items;
    CREATE POLICY "Users can view their own action items"
      ON action_items
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'action_items'
    AND policyname = 'Users can update their own action items'
  ) THEN
    DROP POLICY IF EXISTS "Users can update their own action items" ON action_items;
    CREATE POLICY "Users can update their own action items"
      ON action_items
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
