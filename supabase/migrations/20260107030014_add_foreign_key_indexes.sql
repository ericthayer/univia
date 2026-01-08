/*
  # Add Foreign Key Indexes

  ## Overview
  Adds indexes for all foreign key columns to improve query performance and
  constraint checking. Foreign key indexes are essential even if not immediately
  used by queries, as they optimize:
  - JOIN operations
  - Foreign key constraint validation
  - CASCADE operations (UPDATE/DELETE)
  - Referential integrity checks

  ## Indexes Added

  ### 1. accessibility_audits table
  - idx_audits_business_id on business_id (FK to businesses)

  ### 2. action_items table
  - idx_action_items_business_id on business_id (FK to businesses)
  - idx_action_items_related_audit_id on related_audit_id (FK to accessibility_audits)
  - idx_action_items_related_letter_id on related_letter_id (FK to demand_letters)

  ### 3. action_plans table
  - idx_action_plans_user_id on user_id (FK to auth.users)

  ### 4. demand_letters table
  - idx_demand_letters_business_id on business_id (FK to businesses)
  - idx_demand_letters_user_id on user_id (FK to auth.users)

  ### 5. pinned_audits table
  - idx_pinned_audits_audit_id on audit_id (FK to accessibility_audits)

  ### 6. shared_analysis_links table
  - idx_shared_links_created_by on created_by (FK to auth.users)
  - idx_shared_links_letter_id on letter_id (FK to demand_letters)

  ## Performance Impact
  - Faster JOIN operations across all tables
  - Improved CASCADE operation performance
  - Better query optimizer statistics
  - Reduced lock contention on foreign key checks
*/

-- =============================================================================
-- ACCESSIBILITY_AUDITS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_audits_business_id 
  ON accessibility_audits(business_id);

-- =============================================================================
-- ACTION_ITEMS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_action_items_business_id 
  ON action_items(business_id);

CREATE INDEX IF NOT EXISTS idx_action_items_related_audit_id 
  ON action_items(related_audit_id);

CREATE INDEX IF NOT EXISTS idx_action_items_related_letter_id 
  ON action_items(related_letter_id);

-- =============================================================================
-- ACTION_PLANS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_action_plans_user_id 
  ON action_plans(user_id);

-- =============================================================================
-- DEMAND_LETTERS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_demand_letters_business_id 
  ON demand_letters(business_id);

CREATE INDEX IF NOT EXISTS idx_demand_letters_user_id 
  ON demand_letters(user_id);

-- =============================================================================
-- PINNED_AUDITS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_pinned_audits_audit_id 
  ON pinned_audits(audit_id);

-- =============================================================================
-- SHARED_ANALYSIS_LINKS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_shared_links_created_by 
  ON shared_analysis_links(created_by);

CREATE INDEX IF NOT EXISTS idx_shared_links_letter_id 
  ON shared_analysis_links(letter_id);