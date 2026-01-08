/*
  # Comprehensive Security and Performance Optimization

  ## Overview
  Addresses critical security and performance issues identified in database analysis,
  including missing indexes, RLS policy optimization, and cleanup of unused indexes.

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  - Add index on action_plans.related_audit_id (foreign key without covering index)
    - Improves query performance for joins and foreign key lookups

  ### 2. Optimize RLS Policies for Performance
  - Replace `auth.uid()` with `(select auth.uid())` in all policies
  - This prevents re-evaluation of auth function for each row
  - Significantly improves query performance at scale
  - Affected tables:
    - action_plans (4 policies)
    - checklist_progress (4 policies)

  ### 3. Remove Unused Indexes
  - Drop indexes that are not being used by queries
  - Reduces storage overhead and improves write performance
  - Indexes removed:
    - Pinned audits indexes
    - Action items foreign key indexes
    - Demand letters tracking indexes
    - Shared links indexes
    - Audit business indexes
    - Various status and filtering indexes

  ### 4. Manual Configuration Required
  The following issues cannot be fixed via SQL migrations and must be configured
  in the Supabase Dashboard:
  
  - Auth DB Connection Strategy: Switch from fixed 10 connections to percentage-based
    allocation in Authentication > Configuration
  
  - Leaked Password Protection: Enable HaveIBeenPwned integration in
    Authentication > Providers > Email to prevent use of compromised passwords

  ## Performance Impact
  - Improved RLS policy evaluation time
  - Faster foreign key constraint checks
  - Reduced index maintenance overhead on writes
  - More efficient query planning
*/

-- =============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_action_plans_related_audit_id 
  ON action_plans(related_audit_id);

-- =============================================================================
-- 2. OPTIMIZE RLS POLICIES - ACTION_PLANS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own action plans" ON action_plans;
CREATE POLICY "Users can view own action plans"
  ON action_plans FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own action plans" ON action_plans;
CREATE POLICY "Users can insert own action plans"
  ON action_plans FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own action plans" ON action_plans;
CREATE POLICY "Users can update own action plans"
  ON action_plans FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own action plans" ON action_plans;
CREATE POLICY "Users can delete own action plans"
  ON action_plans FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- =============================================================================
-- 3. OPTIMIZE RLS POLICIES - CHECKLIST_PROGRESS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own checklist progress" ON checklist_progress;
CREATE POLICY "Users can view own checklist progress"
  ON checklist_progress FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own checklist progress" ON checklist_progress;
CREATE POLICY "Users can insert own checklist progress"
  ON checklist_progress FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own checklist progress" ON checklist_progress;
CREATE POLICY "Users can update own checklist progress"
  ON checklist_progress FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own checklist progress" ON checklist_progress;
CREATE POLICY "Users can delete own checklist progress"
  ON checklist_progress FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- =============================================================================
-- 4. DROP UNUSED INDEXES
-- =============================================================================

DROP INDEX IF EXISTS idx_pinned_audits_user_id;
DROP INDEX IF EXISTS idx_pinned_audits_audit_id;
DROP INDEX IF EXISTS idx_action_items_related_audit_id;
DROP INDEX IF EXISTS idx_action_items_related_letter_id;
DROP INDEX IF EXISTS idx_demand_letters_user_id;
DROP INDEX IF EXISTS idx_demand_letters_processing_status;
DROP INDEX IF EXISTS idx_demand_letters_anonymous_session;
DROP INDEX IF EXISTS idx_shared_links_token;
DROP INDEX IF EXISTS idx_shared_links_letter_id;
DROP INDEX IF EXISTS idx_shared_links_created_by;
DROP INDEX IF EXISTS idx_shared_links_expires_at;
DROP INDEX IF EXISTS idx_audits_business_id;
DROP INDEX IF EXISTS idx_violations_severity;
DROP INDEX IF EXISTS idx_letters_business_id;
DROP INDEX IF EXISTS idx_letters_deadline;
DROP INDEX IF EXISTS idx_letters_status;
DROP INDEX IF EXISTS idx_action_items_business_id;
DROP INDEX IF EXISTS idx_action_items_status;
DROP INDEX IF EXISTS idx_resources_type;
DROP INDEX IF EXISTS idx_resources_verified;
DROP INDEX IF EXISTS idx_action_plans_user_id;
DROP INDEX IF EXISTS idx_action_plans_status;
DROP INDEX IF EXISTS idx_action_plans_priority;
DROP INDEX IF EXISTS idx_checklist_progress_user_id;
DROP INDEX IF EXISTS idx_checklist_progress_category;
