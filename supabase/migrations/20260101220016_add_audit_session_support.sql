/*
  # Add Audit Session Support
  
  1. Changes
    - Add `audit_session_id` column to `accessibility_audits` table to group mobile and desktop audits
    - Add index on `audit_session_id` for better query performance
    
  2. Purpose
    - Enable running both mobile and desktop audits simultaneously
    - Group related audits together for easier retrieval and comparison
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accessibility_audits' AND column_name = 'audit_session_id'
  ) THEN
    ALTER TABLE accessibility_audits ADD COLUMN audit_session_id uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_accessibility_audits_session_id 
ON accessibility_audits(audit_session_id);
