/*
  # Remove Unused Indexes for Performance

  1. Changes
    - Drop 14 unused indexes that are not being utilized by queries
    - Removes overhead from write operations (INSERT, UPDATE, DELETE)
    - Reduces storage space and maintenance costs
    
  2. Indexes Being Removed
    - Device and session tracking indexes on accessibility_audits
    - Foreign key indexes that aren't providing query benefits
    - Business and user relationship indexes on action tables
    - Shared links and pinned audits indexes
    
  3. Performance Impact
    - Improves write performance on affected tables
    - Reduces index maintenance overhead
    - Maintains all necessary indexes for current query patterns
    
  4. Notes
    - Indexes can be recreated if query patterns change
    - Only removing indexes confirmed as unused by monitoring
*/

DROP INDEX IF EXISTS idx_audits_device_type;
DROP INDEX IF EXISTS idx_audits_user_device;
DROP INDEX IF EXISTS idx_accessibility_audits_session_id;
DROP INDEX IF EXISTS idx_action_plans_related_audit_id;
DROP INDEX IF EXISTS idx_action_items_business_id;
DROP INDEX IF EXISTS idx_action_items_related_audit_id;
DROP INDEX IF EXISTS idx_action_items_related_letter_id;
DROP INDEX IF EXISTS idx_action_plans_user_id;
DROP INDEX IF EXISTS idx_demand_letters_business_id;
DROP INDEX IF EXISTS idx_demand_letters_user_id;
DROP INDEX IF EXISTS idx_pinned_audits_audit_id;
DROP INDEX IF EXISTS idx_shared_links_created_by;
DROP INDEX IF EXISTS idx_shared_links_letter_id;
DROP INDEX IF EXISTS idx_audits_business_id;